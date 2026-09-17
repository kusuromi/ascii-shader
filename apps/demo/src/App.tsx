import { useState } from "react";
import {
  AsciiBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@ascii-background/react";
import { AsciiWebglBackground } from "./webgl/AsciiWebglBackground";
import { isWebglAvailable } from "./webgl/isWebglAvailable";
import "@ascii-background/react/styles.css";

type Engine = "auto" | "canvas2d" | "webgl";

const ENGINES: { id: Engine; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "canvas2d", label: "Canvas 2D" },
  { id: "webgl", label: "WebGL" },
];

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();
  const [engine, setEngine] = useState<Engine>("auto");
  const [webglFailed, setWebglFailed] = useState(false);

  const resolvedEngine = (() => {
    if (webglFailed) return "canvas2d";
    if (engine !== "auto") return engine;
    return isWebglAvailable() ? "webgl" : "canvas2d";
  })();

  return (
    <main className="demo">
      {resolvedEngine === "canvas2d" ? (
        <AsciiBackground className="demo__background" {...settings} />
      ) : (
        <AsciiWebglBackground
          className="demo__background"
          settings={settings}
          onEngineFailure={() => setWebglFailed(true)}
        />
      )}

      <div className="demo__engine" role="group" aria-label="Engine">
        {ENGINES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`demo__engine-button${engine === id ? " is-active" : ""}`}
            onClick={() => setEngine(id)}
            data-engine={id}
          >
            {id === "auto"
              ? `Auto (${resolvedEngine === "webgl" ? "WebGL" : "Canvas 2D"})`
              : label}
          </button>
        ))}
      </div>

      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}
