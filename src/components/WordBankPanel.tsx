"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings-context";
import { useWordBank } from "@/lib/word-bank-context";
import { useTranslation } from "@/hooks/useTranslation";

export default function WordBankPanel({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const { entries, removeEntry } = useWordBank();
  const { t } = useTranslation();
  const dark = settings.darkMode;

  // Filter to current language, or show all if language is English
  const filtered =
    settings.language === "english"
      ? entries
      : entries.filter((e) => e.language === settings.language);

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
            {t("wordBank")}
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
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">📚</span>
              <p
                className={`text-sm font-medium ${
                  dark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t("wordBankEmpty")}
              </p>
              <p
                className={`text-xs mt-1 ${
                  dark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t("wordBankEmptyDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl ${
                    dark ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold text-sm ${
                          dark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {entry.word}
                      </p>
                      <p
                        className={`text-xs ${
                          dark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {entry.translation}
                      </p>
                      <p
                        className={`text-[10px] mt-1 truncate ${
                          dark ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {entry.scenarioTitle} — &ldquo;
                        {entry.contextMessage.slice(0, 60)}
                        {entry.contextMessage.length > 60 ? "..." : ""}
                        &rdquo;
                      </p>
                    </div>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className={`shrink-0 p-1.5 rounded-lg ${
                        dark
                          ? "text-gray-500 hover:bg-gray-700 hover:text-red-400"
                          : "text-gray-400 hover:bg-gray-200 hover:text-red-500"
                      }`}
                      title={t("wordBankDelete")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer link */}
        <div
          className={`shrink-0 px-5 py-3 border-t ${
            dark ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <Link
            href="/word-bank"
            className="text-blue-500 text-sm font-medium hover:underline"
            onClick={onClose}
          >
            {t("wordBankViewAll")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
