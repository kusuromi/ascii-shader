import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import {
  createAsciiEngineHost,
  type AsciiSettings,
} from "@ascii-background/core";
import { createAsciiShaderRenderer } from "./asciiShader";

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

    const setDebugRenderer = (value: unknown) => {
      (window as { __asciiShaderDebug?: unknown }).__asciiShaderDebug = value ?? undefined;
    };

    const createRenderer = () => {
      renderer = createAsciiShaderRenderer(gl);
      setDebugRenderer(renderer);
    };
    createRenderer();

    const host = createAsciiEngineHost({
      container,
      canvas,
      getSettings: () => settingsRef.current,
      getPaused: () => pausedRef.current,
      onEngineFailure: () => onEngineFailureRef.current?.(),
      resize: () => {
        // The renderer reads sizes from uniforms every frame; nothing to prepare.
      },
      render: (frame) => {
        renderer?.render({
          width: frame.dimensions.width,
          height: frame.dimensions.height,
          dpr: frame.dpr,
          time: frame.time,
          settings: frame.settings,
          pointer: frame.pointer,
        });
      },
      context: {
        element: canvas,
        createRenderer: () => {
          createRenderer();
        },
        disposeRenderer: () => {
          // GL objects are already invalidated by the loss; dispose is a safe no-op.
          renderer?.dispose();
          renderer = null;
          setDebugRenderer(null);
        },
      },
    });

    requestPaintRef.current = host.requestPaint;

    return () => {
      requestPaintRef.current = null;
      delete (window as { __asciiShaderDebug?: unknown }).__asciiShaderDebug;
      host.stop();
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
