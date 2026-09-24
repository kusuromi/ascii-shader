import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  createAsciiEngineHost,
  normalizeAsciiSettings,
  type AsciiSettings,
} from "@kusuromi/ascii-shader-core";
import { createAsciiShaderRenderer } from "@kusuromi/ascii-shader-renderer";

export type AsciiShaderProps = Partial<Omit<AsciiSettings, "cursor">> & {
  cursor?: Partial<AsciiSettings["cursor"]>;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function AsciiShader({
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
}: AsciiShaderProps) {
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

    let host: ReturnType<typeof createAsciiEngineHost> | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let shaderRenderer: ReturnType<typeof createAsciiShaderRenderer> | null = null;

    const createRenderer = () => {
      shaderRenderer?.dispose();
      shaderRenderer = null;
      const gl = canvas?.getContext("webgl");
      if (!gl) return;
      try {
        shaderRenderer = createAsciiShaderRenderer(gl);
      } catch {
        shaderRenderer = null;
      }
    };

    const teardown = () => {
      host?.stop();
      host = null;
      shaderRenderer?.dispose();
      shaderRenderer = null;
      canvas?.remove();
      canvas = null;
    };

    const next = document.createElement("canvas");
    next.style.cssText = "display:block;width:100%;height:100%;background:#000";
    container.appendChild(next);
    canvas = next;

    createRenderer();
    if (shaderRenderer && !host) {
      host = createAsciiEngineHost({
        container,
        canvas: next,
        getSettings: () => settingsRef.current,
        getPaused: () => pausedRef.current,
        resize: () => {},
        render: (frame) => {
          shaderRenderer?.render({
            width: frame.dimensions.width,
            height: frame.dimensions.height,
            time: frame.time,
            dpr: frame.dpr,
            settings: frame.settings,
            pointer: { currentX: frame.pointer.currentX, currentY: frame.pointer.currentY },
          });
        },
        context: {
          element: next,
          createRenderer,
          disposeRenderer: () => {
            shaderRenderer?.dispose();
            shaderRenderer = null;
          },
        },
      });
    }

    requestPaintRef.current = () => host?.requestPaint();

    return () => {
      requestPaintRef.current = null;
      teardown();
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
    />
  );
}
