"use client";

import Link from "next/link";
import { ReportCard as ReportCardType, Message, Scenario } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/hooks/useTranslation";

interface ReportCardProps {
  reportCard: ReportCardType;
  scenario: Scenario;
  messages: Message[];
  onExportTranscript: () => void;
}

function StarRating({ rating, dark }: { rating: number; dark: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={star <= rating ? "#facc15" : dark ? "#374151" : "#d1d5db"}
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

export default function ReportCard({ reportCard, scenario, onExportTranscript }: ReportCardProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const dark = settings.darkMode;
  const { stats, feedback, isLoading, error } = reportCard;

  return (
    <div className={`mx-4 my-2 p-4 rounded-xl text-sm space-y-3 ${dark ? "bg-gray-800 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
      {/* Header */}
      <div className="text-center">
        <p className="text-lg">{scenario.emoji}</p>
        <p className={`font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}>
          {t("reportCardTitle")}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
          {t("reportStatMessages")}: {stats.totalExchanges}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? "bg-amber-900/40 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
          {t("reportStatCorrections")}: {stats.correctionsReceived}
        </span>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dark ? "bg-purple-900/40 text-purple-300" : "bg-purple-50 text-purple-700"}`}>
          {t("reportStatHints")}: {stats.hintsUsed}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {t("reportCardLoading")}
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className={`text-xs text-center ${dark ? "text-red-400" : "text-red-500"}`}>
          {error}
        </p>
      )}

      {/* Feedback section */}
      {feedback && (
        <div className="space-y-3">
          {/* Goal status */}
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 text-base ${feedback.goalAccomplished ? "text-green-500" : "text-red-400"}`}>
              {feedback.goalAccomplished ? "✓" : "✗"}
            </span>
            <p className={`text-xs ${dark ? "text-gray-300" : "text-gray-600"}`}>
              {feedback.goalSummary}
            </p>
          </div>

          {/* Star rating */}
          <div className="flex justify-center">
            <StarRating rating={feedback.overallRating} dark={dark} />
          </div>

          {/* Grammar assessment */}
          <div>
            <p className={`text-xs font-semibold mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              {t("reportGrammar")}
            </p>
            <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {feedback.grammarAssessment}
            </p>
          </div>

          {/* Vocabulary assessment */}
          <div>
            <p className={`text-xs font-semibold mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              {t("reportVocabulary")}
            </p>
            <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {feedback.vocabularyAssessment}
            </p>
          </div>

          {/* Well Done */}
          {feedback.wellDone.length > 0 && (
            <div>
              <p className={`text-xs font-semibold mb-1 ${dark ? "text-green-400" : "text-green-700"}`}>
                {t("reportWellDone")}
              </p>
              <ul className="space-y-0.5">
                {feedback.wellDone.map((item, i) => (
                  <li key={i} className={`text-xs flex items-start gap-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}>
                    <span className="text-green-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* To Improve */}
          {feedback.toImprove.length > 0 && (
            <div>
              <p className={`text-xs font-semibold mb-1 ${dark ? "text-amber-400" : "text-amber-700"}`}>
                {t("reportToImprove")}
              </p>
              <ul className="space-y-0.5">
                {feedback.toImprove.map((item, i) => (
                  <li key={i} className={`text-xs flex items-start gap-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}>
                    <span className="text-amber-500 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          onClick={onExportTranscript}
          className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            dark
              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {t("exportTranscript")}
        </button>
        <Link
          href="/"
          className="inline-block px-4 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors"
        >
          {t("tryAnotherScenario")}
        </Link>
      </div>
    </div>
  );
}
