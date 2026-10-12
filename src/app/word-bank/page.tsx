"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings-context";
import { useWordBank } from "@/lib/word-bank-context";
import { useTranslation } from "@/hooks/useTranslation";
import { languages } from "@/lib/languages";

export default function WordBankPage() {
  const { settings } = useSettings();
  const { entries, isLoading, removeEntry } = useWordBank();
  const { t } = useTranslation();
  const dark = settings.darkMode;

  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);

  // Get languages that have entries
  const entryLanguages = useMemo(() => {
    const set = new Set(entries.map((e) => e.language));
    return languages.filter((l) => set.has(l.id));
  }, [entries]);

  // Filter entries
  const filtered = useMemo(() => {
    let result = entries;
    if (languageFilter) {
      result = result.filter((e) => e.language === languageFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.word.toLowerCase().includes(q) ||
          e.translation.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, languageFilter, search]);

  return (
    <div
      className={`min-h-screen ${
        dark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/"
              className="text-blue-500 text-sm hover:underline mb-1 inline-block"
            >
              ← {t("backToScenarios")}
            </Link>
            <h1 className="text-2xl font-bold">{t("wordBank")}</h1>
            <p
              className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}
            >
              {filtered.length}{" "}
              {filtered.length === 1 ? "word" : "words"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("wordBankSearch")}
            className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
              dark
                ? "bg-gray-900 border-gray-800 text-gray-100 placeholder-gray-600 focus:border-blue-500"
                : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Language filter tabs */}
        {entryLanguages.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setLanguageFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                languageFilter === null
                  ? "bg-blue-500 text-white"
                  : dark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("wordBankAllLanguages")}
            </button>
            {entryLanguages.map((lang) => (
              <button
                key={lang.id}
                onClick={() =>
                  setLanguageFilter(
                    languageFilter === lang.id ? null : lang.id
                  )
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  languageFilter === lang.id
                    ? "bg-blue-500 text-white"
                    : dark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}

        {/* Entries */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div
              className={`w-6 h-6 border-2 rounded-full animate-spin ${
                dark
                  ? "border-gray-700 border-t-blue-400"
                  : "border-gray-200 border-t-blue-500"
              }`}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📚</span>
            <p
              className={`text-lg font-medium ${
                dark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {t("wordBankEmpty")}
            </p>
            <p
              className={`text-sm mt-1 ${
                dark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("wordBankEmptyDesc")}
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-500 text-sm font-medium hover:underline"
            >
              {t("backToScenarios")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border ${
                  dark
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base">{entry.word}</p>
                    <p
                      className={`text-sm ${
                        dark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {entry.translation}
                    </p>
                    <div
                      className={`mt-2 text-xs ${
                        dark ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      <p>
                        {t("wordBankContext")}: &ldquo;
                        {entry.contextMessage.slice(0, 100)}
                        {entry.contextMessage.length > 100 ? "..." : ""}
                        &rdquo;
                      </p>
                      <p className="mt-0.5">
                        {entry.scenarioTitle} ·{" "}
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className={`shrink-0 p-2 rounded-lg transition-colors ${
                      dark
                        ? "text-gray-600 hover:bg-gray-800 hover:text-red-400"
                        : "text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    }`}
                    title={t("wordBankDelete")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
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
    </div>
  );
}
