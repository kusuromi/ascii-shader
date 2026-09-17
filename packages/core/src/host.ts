import type { AsciiPointerState, AsciiSettings } from "./types";

export const MAX_DEVICE_PIXEL_RATIO = 2;
export const TARGET_FRAME_RATE = 60;
export const CONTEXT_RESTORE_TIMEOUT_MS = 5000;

export type AsciiHostFrame = {
  dimensions: { width: number; height: number };
  dpr: number;
  time: number;
  settings: AsciiSettings;
  pointer: AsciiPointerState;
};

export type AsciiEngineHostOptions = {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  getSettings: () => AsciiSettings;
  getPaused: () => boolean;
  /** Size the canvas backing store and prepare the drawing surface for the new size. */
  resize: (dimensions: { width: number; height: number }, dpr: number) => void;
  render: (frame: AsciiHostFrame) => void;
  /** Called when the engine cannot start or a WebGL context is lost permanently. */
  onEngineFailure?: () => void;
  /** Optional WebGL context-loss lifecycle; omitted for the Canvas 2D engine. */
  context?: {
    element: HTMLCanvasElement;
    createRenderer: () => void;
    disposeRenderer: () => void;
  };
};

export function createAsciiEngineHost(options: AsciiEngineHostOptions) {
  const { container, canvas } = options;
  const pointer: AsciiPointerState = {
    currentX: 0.5,
    currentY: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  };

  let dimensions = { width: 1, height: 1, dpr: 1 };

  let frameId: number | null = null;
  let lastAnimationTime = globalThis.performance.now();
  let animationTime = 0;
  let isIntersecting = true;
  let documentVisible = !document.hidden;
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let elementBounds = { left: 0, top: 0, width: 1, height: 1 };
  let pendingResize: { width: number; height: number } | null = null;
  let forcePaint = true;
  let nextPaintTime = 0;

  let contextLost = false;
  let restoreTimer: number | null = null;
  const { context } = options;

  const applyPendingResize = () => {
    if (!pendingResize) return;

    const { width, height } = pendingResize;
    pendingResize = null;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const pixelWidth = Math.max(1, Math.round(Math.max(1, width) * dpr));
    const pixelHeight = Math.max(1, Math.round(Math.max(1, height) * dpr));

    dimensions = { width: pixelWidth / dpr, height: pixelHeight / dpr, dpr };

    // Changing canvas.width/canvas.height clears the bitmap immediately.
    // Commit the resize only inside the same animation frame that repaints it,
    // so the browser never composites an empty canvas while the window is resizing.
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

    options.resize(dimensions, dpr);
  };

  const paint = (now: number) => {
    const settings = options.getSettings();
    const delta = Math.min(48, now - lastAnimationTime);
    lastAnimationTime = now;

    if (!reducedMotion && !options.getPaused()) {
      animationTime += (delta / 1000) * settings.speed;
    }

    if (reducedMotion) {
      pointer.currentX = pointer.targetX;
      pointer.currentY = pointer.targetY;
    } else {
      pointer.currentX += (pointer.targetX - pointer.currentX) * settings.cursor.follow;
      pointer.currentY += (pointer.targetY - pointer.currentY) * settings.cursor.follow;
    }

    options.render({
      dimensions,
      dpr: dimensions.dpr,
      time: animationTime,
      settings,
      pointer,
    });
  };

  const loop = (now: number) => {
    frameId = null;
    const canAnimate =
      !contextLost && isIntersecting && documentVisible && !options.getPaused() && !reducedMotion;
    const frameInterval = 1000 / TARGET_FRAME_RATE;
    const animationFrameDue = canAnimate && (nextPaintTime === 0 || now >= nextPaintTime);
    const shouldPaint = forcePaint || animationFrameDue;

    if (shouldPaint) {
      applyPendingResize();
      paint(now);
      forcePaint = false;

      if (canAnimate) {
        if (nextPaintTime === 0) nextPaintTime = now + frameInterval;
        while (nextPaintTime <= now) nextPaintTime += frameInterval;
      } else {
        nextPaintTime = 0;
      }
    }

    if (canAnimate || forcePaint) {
      frameId = requestAnimationFrame(loop);
    }
  };

  const requestPaint = () => {
    if (contextLost) return;
    forcePaint = true;
    if (frameId === null) frameId = requestAnimationFrame(loop);
  };

  const updateElementBounds = () => {
    const rect = container.getBoundingClientRect();
    elementBounds = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const updatePointer = (clientX: number, clientY: number) => {
    if (elementBounds.width <= 0 || elementBounds.height <= 0) return;

    pointer.targetX = Math.min(1, Math.max(0, (clientX - elementBounds.left) / elementBounds.width));
    pointer.targetY = Math.min(1, Math.max(0, (clientY - elementBounds.top) / elementBounds.height));
    requestPaint();
  };

  const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
  const onPointerDown = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);

  const resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;
    updateElementBounds();
    pendingResize = { width: elementBounds.width, height: elementBounds.height };
    requestPaint();
  });

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    isIntersecting = entry?.isIntersecting ?? true;
    if (isIntersecting) {
      lastAnimationTime = globalThis.performance.now();
      nextPaintTime = 0;
      requestPaint();
    }
  });

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
    requestPaint();
  };
  const subscribeMotion = () => {
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionPreferenceChange);
    } else {
      motionQuery.addListener(onMotionPreferenceChange);
    }
  };
  const unsubscribeMotion = () => {
    if (typeof motionQuery.removeEventListener === "function") {
      motionQuery.removeEventListener("change", onMotionPreferenceChange);
    } else {
      motionQuery.removeListener(onMotionPreferenceChange);
    }
  };

  const onVisibilityChange = () => {
    documentVisible = !document.hidden;
    if (documentVisible) {
      lastAnimationTime = globalThis.performance.now();
      nextPaintTime = 0;
      requestPaint();
    }
  };

  const onContextLost = (event: Event) => {
    // preventDefault allows the context to be restored later.
    event.preventDefault();
    contextLost = true;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    // GL objects are already invalidated by the loss; dispose is a safe no-op.
    context?.disposeRenderer();
    restoreTimer = window.setTimeout(() => {
      options.onEngineFailure?.();
    }, CONTEXT_RESTORE_TIMEOUT_MS);
  };

  const onContextRestored = () => {
    if (restoreTimer !== null) {
      window.clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    contextLost = false;
    context?.createRenderer();
    lastAnimationTime = globalThis.performance.now();
    nextPaintTime = 0;
    requestPaint();
  };

  if (context) {
    context.element.addEventListener("webglcontextlost", onContextLost);
    context.element.addEventListener("webglcontextrestored", onContextRestored);
  }
  resizeObserver.observe(container);
  intersectionObserver.observe(container);
  subscribeMotion();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });

  updateElementBounds();
  pendingResize = { width: elementBounds.width, height: elementBounds.height };
  requestPaint();

  return {
    requestPaint,
    stop: () => {
      if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      if (context) {
        context.element.removeEventListener("webglcontextlost", onContextLost);
        context.element.removeEventListener("webglcontextrestored", onContextRestored);
      }
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      unsubscribeMotion();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
