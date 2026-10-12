"use client";

import PhoneFrame from "@/components/PhoneFrame";
import ScenarioCard from "@/components/ScenarioCard";
import { scenarios } from "@/lib/scenarios";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { getLanguage } from "@/lib/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { getDemoScenarioId } from "@/lib/demo-scripts";
import Link from "next/link";

function LockedScenarioCard({ scenario }: { scenario: typeof scenarios[number] }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const dark = settings.darkMode;
  const useLocalized = settings.uiInTargetLanguage && settings.language !== "english";
  const title = useLocalized ? scenario.localizedTitle : scenario.title;
  const character = useLocalized ? scenario.localizedCharacter : scenario.character;

  return (
    <div
      className={`relative block p-4 rounded-2xl shadow-sm border overflow-hidden ${
        dark
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-100"
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
      {/* Lock overlay */}
      <div className={`absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-sm ${
        dark ? "bg-gray-800/70" : "bg-white/70"
      }`}>
        <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm ${
          dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
          </svg>
          Sign in to unlock
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const lang = getLanguage(settings.language);
  const { t } = useTranslation();

  const filtered = scenarios.filter((s) => s.language === settings.language);
  const everyday = filtered.filter((s) => s.category === "everyday");
  const travel = filtered.filter((s) => s.category === "travel");

  const isGuest = !user;
  const demoScenarioId = getDemoScenarioId(settings.language);

  const chooseText = t("chooseScenario").replace("{language}", lang?.name ?? "language skills");

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isGuest && (
          <div className={`text-center mb-4 p-3 rounded-xl ${dark ? "bg-blue-900/20 border border-blue-800/30" : "bg-blue-50 border border-blue-100"}`}>
            <p className={`text-xs font-medium ${dark ? "text-blue-300" : "text-blue-600"}`}>
              Try a free demo conversation below, or{" "}
              <Link href="/auth/login" className="underline font-semibold">sign in</Link>
              {" "}to unlock everything.
            </p>
          </div>
        )}

        <p className={`text-center text-sm mb-5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
          {chooseText}
        </p>

        <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          {t("everyday")}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {everyday.map((s) =>
            !isGuest || s.id === demoScenarioId ? (
              <ScenarioCard key={s.id} scenario={s} />
            ) : (
              <LockedScenarioCard key={s.id} scenario={s} />
            )
          )}
        </div>

        <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          {t("travel")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {travel.map((s) =>
            !isGuest || s.id === demoScenarioId ? (
              <ScenarioCard key={s.id} scenario={s} />
            ) : (
              <LockedScenarioCard key={s.id} scenario={s} />
            )
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
