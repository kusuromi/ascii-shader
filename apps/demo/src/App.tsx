import {
  AsciiShader,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@ascii-shader/react";
import "@ascii-shader/react/styles.css";

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();

  return (
    <main className="demo">
      <AsciiShader className="demo__background" {...settings} />

      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}