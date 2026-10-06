import type { CSSProperties } from "react";
import { AsciiShader, type AsciiShaderProps } from "./AsciiShader";

export type AsciiShaderBackgroundProps = Omit<AsciiShaderProps, "className" | "style"> & {
  className?: string;
  style?: CSSProperties;
};

export function AsciiShaderBackground({
  className,
  style,
  ...settings
}: AsciiShaderBackgroundProps) {
  return (
    <div
      className={`ascii-shader-background${className ? ` ${className}` : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      <AsciiShader {...settings} />
    </div>
  );
}
