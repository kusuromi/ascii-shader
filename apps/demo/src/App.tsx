import {
  AsciiBackground,
  AsciiControls,
  usePersistentAsciiSettings,
} from "@ascii-background/react";
import "@ascii-background/react/styles.css";

export default function App() {
  const { settings, setSettings, resetSettings } = usePersistentAsciiSettings();

  return (
    <main className="demo">
      <AsciiBackground className="demo__background" {...settings} />
      <AsciiControls
        value={settings}
        onValueChange={setSettings}
        onReset={resetSettings}
      />
    </main>
  );
}