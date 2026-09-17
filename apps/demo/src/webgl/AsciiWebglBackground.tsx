import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import type { AsciiSettings } from "@ascii-background/react";
import { createAsciiShaderRenderer } from "./asciiShader";

const MAX_DEVICE_PIXEL_RATIO = 2;
const TARGET_FRAME_RATE = 60;
const CONTEXT_RESTORE_TIMEOUT_MS = 5000;

export type AsciiWebglBackgroundProps = {
  settings: AsciiSettings;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Called when the WebGL context cannot be created or is lost permanently,
   * so the parent can fall back to another engine. */
  onEngineFailure?: () => void;
};

export function AsciiWebglBackground({
  settings,
  paused = false,
  className,
  style,
  onEngineFailure,
}: AsciiWebglBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const settingsRef = useRef(settings);
  const pausedRef = useRef(paused);
  const onEngineFailureRef = useRef(onEngineFailure);
  const requestPaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
    requestPaintRef.current?.();
  }, [settings]);

  useEffect(() => {
    pausedRef.current = paused;
    requestPaintRef.current?.();
  }, [paused]);

  useEffect(() => {
    onEngineFailureRef.current = onEngineFailure;
  }, [onEngineFailure]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) {
      onEngineFailureRef.current?.();
      return;
    }

    type Renderer = ReturnType<typeof createAsciiShaderRenderer>;
    let renderer: Renderer | null = null;
    let contextLost = false;
    let restoreTimer: number | null = null;

    const setDebugRenderer = (value: unknown) => {
      (window as { __asciiShaderDebug?: unknown }).__asciiShaderDebug = value ?? undefined;
    };

    const createRenderer = () => {
      renderer = createAsciiShaderRenderer(gl);
      setDebugRenderer(renderer);
    };
    createRenderer();

    const pointer = { currentX: 0.5, currentY: 0.5, targetX: 0.5, targetY: 0.5 };
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

    const applyPendingResize = () => {
      if (!pendingResize) return;

      const { width, height } = pendingResize;
      pendingResize = null;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const pixelWidth = Math.max(1, Math.round(Math.max(1, width) * dpr));
      const pixelHeight = Math.max(1, Math.round(Math.max(1, height) * dpr));

      dimensions = { width: pixelWidth / dpr, height: pixelHeight / dpr, dpr };

      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    };

    const paint = (now: number) => {
      if (!renderer) return;
      const current = settingsRef.current;
      const delta = Math.min(48, now - lastAnimationTime);
      lastAnimationTime = now;

      if (!reducedMotion && !pausedRef.current) {
        animationTime += (delta / 1000) * current.speed;
      }

      if (reducedMotion) {
        pointer.currentX = pointer.targetX;
        pointer.currentY = pointer.targetY;
      } else {
        pointer.currentX += (pointer.targetX - pointer.currentX) * current.cursor.follow;
        pointer.currentY += (pointer.targetY - pointer.currentY) * current.cursor.follow;
      }

      renderer.render({
        width: dimensions.width,
        height: dimensions.height,
        dpr: dimensions.dpr,
        time: animationTime,
        settings: current,
        pointer: { currentX: pointer.currentX, currentY: pointer.currentY },
      });
    };

    const loop = (now: number) => {
      frameId = null;
      const canAnimate =
        !contextLost && isIntersecting && documentVisible && !pausedRef.current && !reducedMotion;
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

    requestPaintRef.current = requestPaint;

    const onContextLost = (event: Event) => {
      // preventDefault allows the context to be restored later.
      event.preventDefault();
      contextLost = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      // GL objects are already invalidated by the loss; dispose is a safe no-op.
      renderer?.dispose();
      renderer = null;
      setDebugRenderer(null);
      restoreTimer = window.setTimeout(() => {
        onEngineFailureRef.current?.();
      }, CONTEXT_RESTORE_TIMEOUT_MS);
    };

    const onContextRestored = () => {
      if (restoreTimer !== null) {
        window.clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      contextLost = false;
      createRenderer();
      lastAnimationTime = globalThis.performance.now();
      nextPaintTime = 0;
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

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
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
      if (restoreTimer !== null) window.clearTimeout(restoreTimer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      delete (window as { __asciiShaderDebug?: unknown }).__asciiShaderDebug;
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      unsubscribeMotion();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      renderer?.dispose();
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
