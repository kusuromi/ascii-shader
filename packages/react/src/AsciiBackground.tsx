import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  createAsciiRenderer,
  normalizeAsciiSettings,
  type AsciiSettings,
  type AsciiPointerState,
  type AsciiRenderDimensions,
} from "@ascii-background/core";

const MAX_DEVICE_PIXEL_RATIO = 2;
const TARGET_FRAME_RATE = 60;

export type AsciiBackgroundProps = Partial<Omit<AsciiSettings, "cursor">> & {
  cursor?: Partial<AsciiSettings["cursor"]>;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function AsciiBackground({
  cursor,
  paused = false,
  className,
  style,
  glyphs,
  glyphCount,
  cellSize,
  frequency,
  speed,
  lightness,
  contrast,
  opacity,
}: AsciiBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestPaintRef = useRef<(() => void) | null>(null);

  const resolvedSettings = useMemo(
    () =>
      normalizeAsciiSettings({
        glyphs,
        glyphCount,
        cellSize,
        frequency,
        speed,
        lightness,
        contrast,
        opacity,
        cursor,
      }),
    [glyphs, glyphCount, cellSize, frequency, speed, lightness, contrast, opacity, cursor],
  );

  const settingsRef = useRef(resolvedSettings);
  const pausedRef = useRef(paused);

  useEffect(() => {
    settingsRef.current = resolvedSettings;
    requestPaintRef.current?.();
  }, [resolvedSettings]);

  useEffect(() => {
    pausedRef.current = paused;
    requestPaintRef.current?.();
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const renderer = createAsciiRenderer();
    const dimensions: AsciiRenderDimensions = { width: 1, height: 1 };
    const pointer: AsciiPointerState = {
      currentX: 0.5,
      currentY: 0.5,
      targetX: 0.5,
      targetY: 0.5,
    };

    let frameId: number | null = null;
    let lastAnimationTime = globalThis.performance.now();
    let nextPaintTime = 0;
    let animationTime = 0;
    let isIntersecting = true;
    let documentVisible = !document.hidden;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let forcePaint = true;
    let pendingResize: { width: number; height: number } | null = null;
    let elementBounds = { left: 0, top: 0, width: 1, height: 1 };

    const applyPendingResize = () => {
      if (!pendingResize) return;

      const { width, height } = pendingResize;
      pendingResize = null;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const pixelWidth = Math.max(1, Math.round(Math.max(1, width) * dpr));
      const pixelHeight = Math.max(1, Math.round(Math.max(1, height) * dpr));

      dimensions.width = pixelWidth / dpr;
      dimensions.height = pixelHeight / dpr;

      // Changing canvas.width/canvas.height clears the bitmap immediately.
      // Commit the resize only inside the same animation frame that repaints it,
      // so the browser never composites an empty canvas while the window is resizing.
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (now: number) => {
      const settings = settingsRef.current;
      const delta = Math.min(48, now - lastAnimationTime);
      lastAnimationTime = now;

      if (!reducedMotion && !pausedRef.current) {
        animationTime += (delta / 1000) * settings.speed;
      }

      if (reducedMotion) {
        pointer.currentX = pointer.targetX;
        pointer.currentY = pointer.targetY;
      } else {
        pointer.currentX += (pointer.targetX - pointer.currentX) * settings.cursor.follow;
        pointer.currentY += (pointer.targetY - pointer.currentY) * settings.cursor.follow;
      }

      renderer.render({
        context,
        dimensions,
        time: animationTime,
        settings,
        pointer,
      });
    };

    const loop = (now: number) => {
      frameId = null;
      const canAnimate =
        isIntersecting && documentVisible && !pausedRef.current && !reducedMotion;
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
      forcePaint = true;
      if (frameId === null) frameId = requestAnimationFrame(loop);
    };

    requestPaintRef.current = () => {
      requestPaint();
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const rect = container.getBoundingClientRect();
      elementBounds = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      pendingResize = { width: rect.width, height: rect.height };
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

    const updatePointer = (clientX: number, clientY: number) => {
      if (elementBounds.width <= 0 || elementBounds.height <= 0) return;

      pointer.targetX = Math.min(1, Math.max(0, (clientX - elementBounds.left) / elementBounds.width));
      pointer.targetY = Math.min(1, Math.max(0, (clientY - elementBounds.top) / elementBounds.height));
      requestPaint();
    };

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
    const onPointerDown = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    subscribeMotion();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    const initialRect = container.getBoundingClientRect();
    elementBounds = {
      left: initialRect.left,
      top: initialRect.top,
      width: initialRect.width,
      height: initialRect.height,
    };
    pendingResize = { width: initialRect.width, height: initialRect.height };
    requestPaint();

    return () => {
      requestPaintRef.current = null;
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      unsubscribeMotion();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#000",
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", background: "#000" }}
      />
    </div>
  );
}
