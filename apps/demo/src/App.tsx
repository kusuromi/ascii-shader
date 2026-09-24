import {
  AsciiShader,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@kusuromi/ascii-shader-react";
import "@kusuromi/ascii-shader-react/styles.css";

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
