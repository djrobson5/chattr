"use client";

import Link from "next/link";
import { Scenario } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/hooks/useTranslation";

export default function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const dark = settings.darkMode;
  const useLocalized = settings.uiInTargetLanguage && settings.language !== "english";
  const title = useLocalized ? scenario.localizedTitle : scenario.title;
  const character = useLocalized ? scenario.localizedCharacter : scenario.character;

  return (
    <Link
      href={`/chat/${scenario.id}`}
      className={`block p-4 rounded-2xl shadow-sm border transition-all active:scale-[0.98] ${
        dark
          ? "bg-gray-800 border-gray-700 hover:shadow-md hover:border-blue-500"
          : "bg-white border-gray-100 hover:shadow-md hover:border-blue-200"
      }`}
    >
      <div className="text-3xl mb-2">{scenario.emoji}</div>
      <h3 className={`font-semibold text-sm ${dark ? "text-gray-100" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-xs mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
        {character} &middot;{" "}
        {scenario.category === "travel" ? t("travel") : t("everyday")}
      </p>
    </Link>
  );
}
