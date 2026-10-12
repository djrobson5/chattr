"use client";

import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/hooks/useTranslation";
import { slangData } from "@/lib/slang-reference";

export default function SlangPanel({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const dark = settings.darkMode;

  const entries = slangData[settings.language] ?? [];

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative ${
          dark ? "bg-gray-900" : "bg-white"
        } rounded-t-2xl animate-slide-up flex-1 flex flex-col mt-16 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0 mb-3 shrink-0">
          <h2
            className={`text-lg font-bold ${
              dark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {t("textingSlang")}
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              dark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            } text-gray-500`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p
                className={`text-sm font-medium ${
                  dark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t("slangEmpty")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div
                  key={entry.abbr}
                  className={`px-3 py-2 rounded-xl ${
                    dark ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-bold text-sm ${
                        dark ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {entry.abbr}
                    </span>
                    <span
                      className={`text-sm ${
                        dark ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {entry.full}
                    </span>
                    <span
                      className={`text-xs ml-auto shrink-0 ${
                        dark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {entry.english}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
