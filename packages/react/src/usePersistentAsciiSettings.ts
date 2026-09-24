import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ASCII_SETTINGS,
  normalizeAsciiSettings,
  type AsciiSettings,
  type PartialAsciiSettings,
} from "@kusuromi/ascii-shader-core";

export type UsePersistentAsciiSettingsOptions = {
  storageKey?: string;
  initialSettings?: PartialAsciiSettings;
};

type SettingsUpdater = AsciiSettings | ((current: AsciiSettings) => AsciiSettings);

export function usePersistentAsciiSettings({
  storageKey = "ascii-shader:settings",
  initialSettings,
}: UsePersistentAsciiSettingsOptions = {}) {
  const defaults = useMemo(
    () => normalizeAsciiSettings(initialSettings ?? DEFAULT_ASCII_SETTINGS),
    [initialSettings],
  );

  const [settings, setSettingsState] = useState<AsciiSettings>(() => {
    if (typeof window === "undefined") return defaults;

    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored
        ? normalizeAsciiSettings(JSON.parse(stored) as PartialAsciiSettings)
        : defaults;
    } catch {
      return defaults;
    }
  });

  const latestSettingsRef = useRef(settings);
  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const writeStoredSettings = useCallback(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(latestSettingsRef.current),
      );
    } catch {
      // Storage can be unavailable in private or restricted environments.
    }
  }, [storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(writeStoredSettings, 200);
    return () => window.clearTimeout(timer);
  }, [settings, storageKey, writeStoredSettings]);

  useEffect(() => {
    return () => {
      writeStoredSettings();
    };
  }, [writeStoredSettings]);

  const setSettings = useCallback((updater: SettingsUpdater) => {
    setSettingsState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return normalizeAsciiSettings(next);
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(defaults);
  }, [defaults]);

  return { settings, setSettings, resetSettings };
}
