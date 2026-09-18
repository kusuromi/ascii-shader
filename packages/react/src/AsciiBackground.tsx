import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  createAsciiEngineHost,
  createAsciiRenderer,
  normalizeAsciiSettings,
  type AsciiSettings,
} from "@ascii-background/core";
import { createAsciiShaderRenderer } from "@ascii-background/webgl";

export type AsciiEngine = "auto" | "canvas2d" | "webgl";

export type AsciiBackgroundProps = Partial<Omit<AsciiSettings, "cursor">> & {
  cursor?: Partial<AsciiSettings["cursor"]>;
  paused?: boolean;
  /** "auto" tries WebGL and falls back to Canvas 2D when it cannot start. */
  engine?: AsciiEngine;
  /** Reports the engine actually in use, after auto-resolution and fallbacks. */
  onEngineChange?: (engine: Exclude<AsciiEngine, "auto">) => void;
  className?: string;
  style?: CSSProperties;
};

export function AsciiBackground({
  cursor,
  paused = false,
  engine = "auto",
  onEngineChange,
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
  const onEngineChangeRef = useRef(onEngineChange);

  useEffect(() => {
    onEngineChangeRef.current = onEngineChange;
  }, [onEngineChange]);

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
    if (!container) return;

    let disposed = false;
    let host: ReturnType<typeof createAsciiEngineHost> | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let renderer: ReturnType<typeof createAsciiRenderer> | null = null;
    let shaderRenderer: ReturnType<typeof createAsciiShaderRenderer> | null = null;
    let currentEngine: Exclude<AsciiEngine, "auto"> = "canvas2d";
    let reportedEngine: Exclude<AsciiEngine, "auto"> | null = null;

    const teardown = () => {
      host?.stop();
      host = null;
      shaderRenderer?.dispose();
      shaderRenderer = null;
      renderer = null;
      canvas?.remove();
      canvas = null;
    };

    const report = (active: Exclude<AsciiEngine, "auto">) => {
      if (active === reportedEngine) return;
      reportedEngine = active;
      onEngineChangeRef.current?.(active);
    };

    const mountHost = (next: HTMLCanvasElement) => {
      host = createAsciiEngineHost({
        container,
        canvas: next,
        getSettings: () => settingsRef.current,
        getPaused: () => pausedRef.current,
        resize: (_dimensions, dpr) => {
          const context = next.getContext("2d");
          if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
        },
        render: (frame) => {
          const context = next.getContext("2d");
          if (context && renderer) {
            renderer.render({
              context,
              dimensions: frame.dimensions,
              time: frame.time,
              settings: frame.settings,
              pointer: frame.pointer,
            });
          } else if (shaderRenderer) {
            shaderRenderer.render({
              width: frame.dimensions.width,
              height: frame.dimensions.height,
              time: frame.time,
              dpr: frame.dpr,
              settings: frame.settings,
              pointer: { currentX: frame.pointer.currentX, currentY: frame.pointer.currentY },
            });
          }
        },
        onEngineFailure: () => {
          if (disposed) return;
          mount("canvas2d");
        },
        context:
          currentEngine === "webgl"
            ? {
                element: next,
                createRenderer: () => {
                  shaderRenderer?.dispose();
                  shaderRenderer = null;
                  const gl = next.getContext("webgl");
                  if (!gl) {
                    if (!disposed) mount("canvas2d");
                    return;
                  }
                  try {
                    shaderRenderer = createAsciiShaderRenderer(gl);
                  } catch {
                    shaderRenderer = null;
                    if (!disposed) mount("canvas2d");
                  }
                },
                disposeRenderer: () => {
                  shaderRenderer?.dispose();
                  shaderRenderer = null;
                },
              }
            : undefined,
      });
    };

    const attempt = (target: Exclude<AsciiEngine, "auto">): boolean => {
      const next = document.createElement("canvas");
      next.style.cssText = "display:block;width:100%;height:100%;background:#000";
      container.appendChild(next);
      canvas = next;

      currentEngine = "canvas2d";

      if (target === "webgl") {
        const gl = next.getContext("webgl");
        if (gl) {
          try {
            shaderRenderer = createAsciiShaderRenderer(gl);
            currentEngine = "webgl";
          } catch {
            shaderRenderer = null;
          }
        }
      }

      if (currentEngine === "canvas2d") {
        const context = next.getContext("2d", { alpha: false });
        if (!context) {
          next.remove();
          canvas = null;
          return false;
        }
        renderer = createAsciiRenderer();
      }

      mountHost(next);
      report(currentEngine);
      return true;
    };

    const mount = (target: Exclude<AsciiEngine, "auto">) => {
      if (disposed) return;
      teardown();
      if (!attempt(target) && target !== "canvas2d") {
        attempt("canvas2d");
      }
    };

    mount(engine === "auto" ? "webgl" : engine);

    requestPaintRef.current = () => host?.requestPaint();

    return () => {
      disposed = true;
      requestPaintRef.current = null;
      teardown();
    };
  }, [engine]);

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
    />
  );
}