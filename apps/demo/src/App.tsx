import {
  AsciiShaderBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@kusuromi/ascii-shader-react";
import "@kusuromi/ascii-shader-react/styles.css";

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();

  return (
    <main className="demo">
      <AsciiShaderBackground className="demo__shader" {...settings} />

      <AsciiControls
        className="demo__controls"
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}
