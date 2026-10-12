"use client";

import { useSettings } from "@/lib/settings-context";
import { Difficulty, FontSize } from "@/lib/types";
import { languages } from "@/lib/languages";
import { useTranslation } from "@/hooks/useTranslation";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl animate-slide-up flex-1 flex flex-col mt-16 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-0 mb-5 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("settings")}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-8">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("language")}
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => update("language", lang.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    settings.language === lang.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* UI in Target Language */}
          {settings.language !== "english" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("uiInTargetLanguage")}
                </p>
                <p className="text-xs text-gray-400">
                  {t("uiInTargetLanguageDesc")}
                </p>
              </div>
              <button
                onClick={() => update("uiInTargetLanguage", !settings.uiInTargetLanguage)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.uiInTargetLanguage ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.uiInTargetLanguage ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("difficultyLevel")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => update("difficulty", level)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                      settings.difficulty === level
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {t(level)}
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {settings.difficulty === "beginner"
                ? t("difficultyBeginner")
                : settings.difficulty === "intermediate"
                ? t("difficultyIntermediate")
                : t("difficultyAdvanced")}
            </p>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("fontSize")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["small", "medium", "large"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => update("fontSize", size)}
                  className={`py-2 px-3 rounded-lg font-medium capitalize transition-colors ${
                    settings.fontSize === size
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  } ${size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-base"}`}
                >
                  {t(size)}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("darkMode")}
              </p>
              <p className="text-xs text-gray-400">{t("darkModeDesc")}</p>
            </div>
            <button
              onClick={() => update("darkMode", !settings.darkMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.darkMode ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.darkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("soundEffects")}
              </p>
              <p className="text-xs text-gray-400">{t("soundEffectsDesc")}</p>
            </div>
            <button
              onClick={() => update("soundEnabled", !settings.soundEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.soundEnabled ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Hint Mode (beginner only) */}
          <div className={`flex items-center justify-between ${settings.difficulty !== "beginner" ? "opacity-40" : ""}`}>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("hintMode")}
              </p>
              <p className="text-xs text-gray-400">
                {settings.difficulty !== "beginner"
                  ? t("hintModeDisabled")
                  : t("hintModeDesc")}
              </p>
            </div>
            <button
              onClick={() => {
                if (settings.difficulty === "beginner") {
                  update("hintMode", !settings.hintMode);
                }
              }}
              disabled={settings.difficulty !== "beginner"}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.hintMode && settings.difficulty === "beginner"
                  ? "bg-blue-500"
                  : "bg-gray-300"
              } ${settings.difficulty !== "beginner" ? "cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.hintMode && settings.difficulty === "beginner"
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Correction Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("correctionMode")}
              </p>
              <p className="text-xs text-gray-400">
                {t("correctionModeDesc")}
              </p>
            </div>
            <button
              onClick={() => update("correctionMode", !settings.correctionMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.correctionMode ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.correctionMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Slang Reference */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("slangReference")}
              </p>
              <p className="text-xs text-gray-400">
                {t("slangReferenceDesc")}
              </p>
            </div>
            <button
              onClick={() => update("slangReference", !settings.slangReference)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.slangReference ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.slangReference ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
