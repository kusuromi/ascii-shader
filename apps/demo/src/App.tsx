import { useState } from "react";
import {
  AsciiBackground,
  AsciiControls,
  usePersistentAsciiSettings,
  type AsciiEngine,
} from "@ascii-background/react";
import "@ascii-background/react/styles.css";

const ENGINES: { id: AsciiEngine; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "canvas2d", label: "Canvas 2D" },
  { id: "webgl", label: "WebGL" },
];

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();
  const [engine, setEngine] = useState<AsciiEngine>("auto");
  const [resolvedEngine, setResolvedEngine] = useState<Exclude<AsciiEngine, "auto">>("canvas2d");

  return (
    <main className="demo">
      <AsciiBackground
        className="demo__background"
        {...settings}
        engine={engine}
        onEngineChange={setResolvedEngine}
      />

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
