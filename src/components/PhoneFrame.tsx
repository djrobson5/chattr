"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { getLanguage } from "@/lib/languages";
import { useTranslation } from "@/hooks/useTranslation";
import SettingsModal from "./SettingsModal";
import Link from "next/link";

type DeviceMode = "phone" | "tablet";

export default function PhoneFrame({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<DeviceMode>("phone");
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem("deviceMode") as DeviceMode | null;
    if (saved === "phone" || saved === "tablet") setMode(saved);
  }, []);

  // Sync body background with dark mode so overscroll matches
  useEffect(() => {
    document.body.style.backgroundColor = settings.darkMode ? "#030712" : "#eff6ff";
  }, [settings.darkMode]);

  function toggleDevice() {
    const next = mode === "phone" ? "tablet" : "phone";
    setMode(next);
    localStorage.setItem("deviceMode", next);
  }

  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  const isTablet = mode === "tablet";
  const dark = settings.darkMode;
  const lang = getLanguage(settings.language);

  return (
    <div className={`h-dvh flex flex-col md:h-auto md:flex-row md:items-center md:justify-center md:min-h-screen md:p-4 ${
      dark ? "bg-gray-900 md:bg-gray-950" : "bg-white md:bg-gradient-to-br md:from-blue-100 md:via-purple-50 md:to-pink-100"
    }`}>
      <div
        className={`flex-1 flex flex-col w-full overflow-hidden md:flex-initial md:relative md:shadow-2xl md:transition-all md:duration-300 ${
          dark ? "bg-gray-900 md:border-gray-700" : "bg-white md:border-gray-800"
        } ${
          isTablet
            ? "md:max-w-[820px] md:h-[620px] md:max-h-[90vh] md:rounded-[24px] md:border-[6px]"
            : "md:max-w-[390px] md:h-[844px] md:max-h-[90vh] md:rounded-[40px] md:border-[8px]"
        }`}
      >
        {/* Status bar — only on desktop (real devices have their own) */}
        <div className={`hidden md:flex items-center justify-between px-8 pt-3 pb-1 text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-800"}`}>
          <span>{time || "9:41"}</span>
          {isTablet ? (
            <div className={`w-2 h-2 rounded-full ${dark ? "bg-gray-600" : "bg-gray-800"}`} />
          ) : (
            <div className={`w-28 h-6 rounded-full ${dark ? "bg-gray-700" : "bg-black"}`} />
          )}
          <div className="flex items-center gap-1">
            {isTablet ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M.676 6.941A12.964 12.964 0 0 1 10 3.5c3.58 0 6.86 1.296 9.324 3.441a.75.75 0 1 1-.998 1.118A11.465 11.465 0 0 0 10 5a11.464 11.464 0 0 0-8.326 3.059.75.75 0 0 1-.998-1.118ZM3.346 9.78A9.466 9.466 0 0 1 10 7a9.466 9.466 0 0 1 6.654 2.78.75.75 0 1 1-1.058 1.064A7.967 7.967 0 0 0 10 8.5a7.967 7.967 0 0 0-5.596 2.344.75.75 0 1 1-1.058-1.064ZM6.017 12.617A5.97 5.97 0 0 1 10 10.5a5.97 5.97 0 0 1 3.983 2.117.75.75 0 1 1-1.116 1.004A4.47 4.47 0 0 0 10 12a4.47 4.47 0 0 0-2.867 1.621.75.75 0 1 1-1.116-1.004ZM10 15a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clipRule="evenodd" />
              </svg>
            ) : (
              <span>5G</span>
            )}
            <span>🔋</span>
          </div>
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-gray-700 bg-gray-800/80" : "border-gray-200 bg-gray-50/80"} backdrop-blur`}>
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
            title={t("settings")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.07c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.svg" alt="" className={`h-5 w-auto shrink-0 ${dark ? "invert" : ""}`} />
            <div className="min-w-0">
              <h1 className={`font-bold text-sm leading-tight ${dark ? "text-gray-100" : "text-gray-800"}`}>
                Chattr
              </h1>
              <p className={`text-[10px] leading-tight truncate ${dark ? "text-gray-500" : "text-gray-400"}`}>
                {t("textingSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language badge */}
            {lang && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                {lang.flag}
              </span>
            )}

            {/* User / Auth button */}
            {user ? (
              <button
                onClick={() => signOut()}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${dark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                title="Sign out"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="w-6 h-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${dark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}>
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                title="Sign in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
              </Link>
            )}

            {/* Device toggle — hidden on mobile (no frame to toggle) */}
            <button
              onClick={toggleDevice}
              className={`hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
              title={isTablet ? t("switchToPhone") : t("switchToTablet")}
            >
              {isTablet ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
                  <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3h6.75C15.996 3 16.5 3.504 16.5 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M10.5 18a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
                  <path fillRule="evenodd" d="M7.125 1.5A3.375 3.375 0 0 0 3.75 4.875v14.25A3.375 3.375 0 0 0 7.125 22.5h9.75a3.375 3.375 0 0 0 3.375-3.375V4.875A3.375 3.375 0 0 0 16.875 1.5h-9.75ZM6 4.875c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-9.75A1.125 1.125 0 0 1 6 19.125V4.875Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

        {/* Settings modal */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}
