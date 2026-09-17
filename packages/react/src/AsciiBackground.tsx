import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  createAsciiEngineHost,
  createAsciiRenderer,
  normalizeAsciiSettings,
  type AsciiSettings,
} from "@ascii-background/core";

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

    const host = createAsciiEngineHost({
      container,
      canvas,
      getSettings: () => settingsRef.current,
      getPaused: () => pausedRef.current,
      resize: (_dimensions, dpr) => {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
      render: (frame) => {
        renderer.render({
          context,
          dimensions: frame.dimensions,
          time: frame.time,
          settings: frame.settings,
          pointer: frame.pointer,
        });
      },
    });

    requestPaintRef.current = host.requestPaint;

    return () => {
      requestPaintRef.current = null;
      host.stop();
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
