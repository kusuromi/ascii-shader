import type { CSSProperties } from "react";
import { AsciiShader, type AsciiShaderProps } from "./AsciiShader";

// Minimum top bleed covers the status-bar area on Dynamic Island devices when the safe-area inset is 0.
const MINIMUM_TOP_BLEED = "62px";

type AsciiShaderBackgroundStyle = CSSProperties & {
  "--ascii-shader-top-bleed": string;
};

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
        position: "absolute",
        top: "calc(0px - max(env(safe-area-inset-top, 0px), var(--ascii-shader-top-bleed)))",
        bottom: 0,
        left: 0,
        right: 0,
        height: "auto",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        "--ascii-shader-top-bleed": MINIMUM_TOP_BLEED,
        ...style,
      } as AsciiShaderBackgroundStyle}
      aria-hidden="true"
    >
      <AsciiShader {...settings} />
    </div>
  );
}
