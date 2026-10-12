"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppSettings } from "./types";

const defaults: AppSettings = {
  difficulty: "intermediate",
  darkMode: false,
  fontSize: "medium",
  correctionMode: false,
  hintMode: false,
  language: "italian",
  soundEnabled: true,
  uiInTargetLanguage: false,
  slangReference: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaults,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("appSettings");
      if (saved) {
        setSettings({ ...defaults, ...JSON.parse(saved) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("appSettings", JSON.stringify(settings));
    }
  }, [settings, loaded]);

  // Apply dark mode to <html>
  useEffect(() => {
    if (loaded) {
      document.documentElement.classList.toggle("dark", settings.darkMode);
    }
  }, [settings.darkMode, loaded]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-disable hint mode when leaving beginner
      if (key === "difficulty" && value !== "beginner") {
        next.hintMode = false;
      }
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
