import { useLayoutEffect } from "react";
import {
  AsciiShaderBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@kusuromi/ascii-shader-react";
import "@kusuromi/ascii-shader-react/styles.css";

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const supportsSafariRunway =
      window.matchMedia("(max-width: 1024px)").matches &&
      navigator.maxTouchPoints > 0 &&
      CSS.supports("-webkit-touch-callout", "none");

    root.classList.toggle("safari-shader-runway", supportsSafariRunway);

    const previousScrollRestoration = history.scrollRestoration;
    let frame = 0;
    let orientationTimer: number | undefined;
    let loadHandler: (() => void) | undefined;

    const applyOffset = () => {
      if (!supportsSafariRunway) return;

      const offset = Number.parseFloat(
        getComputedStyle(root).getPropertyValue("--safari-scroll-offset"),
      );

      if (Number.isFinite(offset)) window.scrollTo(0, offset);
    };

    const scheduleOffset = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0;
          applyOffset();
        });
      });
    };

    const handleOrientationChange = () => {
      scheduleOffset();
      if (orientationTimer !== undefined) window.clearTimeout(orientationTimer);
      orientationTimer = window.setTimeout(() => {
        orientationTimer = undefined;
        scheduleOffset();
      }, 250);
    };

    if (supportsSafariRunway) {
      history.scrollRestoration = "manual";
      applyOffset();
      scheduleOffset();
      window.addEventListener("resize", scheduleOffset);
      window.addEventListener("orientationchange", handleOrientationChange);
      window.visualViewport?.addEventListener("resize", scheduleOffset);

      if (document.readyState !== "complete") {
        loadHandler = scheduleOffset;
        window.addEventListener("load", loadHandler, { once: true });
      }
    } else if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (orientationTimer !== undefined) window.clearTimeout(orientationTimer);
      if (loadHandler) window.removeEventListener("load", loadHandler);
      window.removeEventListener("resize", scheduleOffset);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.visualViewport?.removeEventListener("resize", scheduleOffset);
      history.scrollRestoration = previousScrollRestoration;
      root.classList.remove("safari-shader-runway");
    };
  }, []);

  return (
    <main className="demo">
      <AsciiShaderBackground {...settings} />

      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}
