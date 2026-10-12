"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import PhoneFrame from "@/components/PhoneFrame";
import ChatArea from "@/components/ChatArea";
import InputBar from "@/components/InputBar";
import ReportCardComponent from "@/components/ReportCard";
import WordBankPopup from "@/components/WordBankPopup";
import WordBankPanel from "@/components/WordBankPanel";
import SlangPanel from "@/components/SlangPanel";
import { useChat } from "@/hooks/useChat";
import { useDemoChat } from "@/hooks/useDemoChat";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/hooks/useTranslation";

import { Message, Scenario, ReportCard } from "@/lib/types";

function buildTranscript(title: string, character: string, msgs: Message[]): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let text = `Chattr — Texting Simulation — Transcript\n`;
  text += `Scenario: ${title}\n`;
  text += `Date: ${date}\n`;
  text += `${"—".repeat(40)}\n\n`;

  for (const msg of msgs) {
    const speaker = msg.role === "user" ? "You" : character;
    text += `${speaker}: ${msg.content}\n`;
    if (msg.translation) {
      text += `  (${msg.translation})\n`;
    }
    if (msg.correction) {
      text += `  [Correction: ${msg.correction}]\n`;
    }
    text += `\n`;
  }

  return text;
}

function downloadTranscript(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  translatingId: string | null;
  hints: string[];
  conversationEnded: boolean;
  reportCard: ReportCard | null;
  sendMessage: (text: string) => void;
  toggleTranslation: (id: string) => void;
  scenario: Scenario;
  isDemoMode: boolean;
  // Demo mode is fully scripted and never calls the API, so it has neither.
  error?: string | null;
  onRetry?: () => void;
}

function ChatContent({
  messages,
  isLoading,
  translatingId,
  hints,
  conversationEnded,
  reportCard,
  sendMessage,
  toggleTranslation,
  scenario,
  isDemoMode,
  error = null,
  onRetry,
}: ChatContentProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const dark = settings.darkMode;

  // Word bank popup state
  const [popupMessage, setPopupMessage] = useState<Message | null>(null);
  const [popupAnchorRect, setPopupAnchorRect] = useState<DOMRect | null>(null);

  // Word bank panel state
  const [showWordBank, setShowWordBank] = useState(false);

  // Slang panel state
  const [showSlang, setShowSlang] = useState(false);

  const handleLongPressMessage = useCallback(
    (id: string, rect: DOMRect) => {
      const msg = messages.find((m) => m.id === id);
      if (msg && settings.language !== "english") {
        setPopupMessage(msg);
        setPopupAnchorRect(rect);
      }
    },
    [messages, settings.language]
  );

  const closePopup = useCallback(() => {
    setPopupMessage(null);
    setPopupAnchorRect(null);
  }, []);

  return (
    <PhoneFrame>
      {/* Sub-header: back + word bank icon */}
      <div className={`px-4 py-1 border-b flex items-center justify-between ${dark ? "border-gray-700" : "border-gray-100"}`}>
        <Link
          href="/"
          className="text-blue-500 text-sm flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
          {t("scenarios")}
        </Link>

        {!isDemoMode && (
          <div className="flex items-center gap-1">
            {/* Slang reference toggle (hidden for English, respects setting) */}
            {settings.slangReference && settings.language !== "english" && (
              <button
                onClick={() => setShowSlang(true)}
                className={`p-1.5 rounded-lg transition-colors ${
                  dark
                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                title={t("textingSlang")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 0 0 1.33 0l1.713-3.293a.783.783 0 0 1 .642-.413 41.102 41.102 0 0 0 3.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2ZM6.75 6a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5ZM6 9.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 6 9.25Z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {/* Word bank toggle (hidden for English) */}
            {settings.language !== "english" && (
              <button
                onClick={() => setShowWordBank(true)}
                className={`p-1.5 rounded-lg transition-colors ${
                  dark
                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                title={t("wordBank")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <ChatArea
        messages={messages}
        onTapMessage={toggleTranslation}
        onLongPressMessage={handleLongPressMessage}
        translatingId={translatingId}
        isLoading={isLoading}
        footer={
          // Report card (authenticated users only). Rendered inside the chat
          // scroll, after the last message, so it never covers that message.
          !isDemoMode && conversationEnded && !isLoading && reportCard ? (
            <div className="-mx-4">
              <ReportCardComponent
                reportCard={reportCard}
                scenario={scenario}
                messages={messages}
                onExportTranscript={() => {
                  const transcript = buildTranscript(scenario.title, scenario.character, messages);
                  downloadTranscript(`${scenario.id}-transcript.txt`, transcript);
                }}
              />
            </div>
          ) : undefined
        }
      />

      {/* Demo sign-up CTA card */}
      {isDemoMode && conversationEnded && !isLoading && (
        <div className={`mx-4 my-3 p-5 rounded-2xl border text-center ${
          dark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
        }`}>
          <p className={`text-lg font-semibold mb-2 ${dark ? "text-gray-100" : "text-gray-900"}`}>
            Want to have real conversations?
          </p>
          <p className={`text-sm mb-4 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Sign in to unlock all scenarios, AI-powered replies, grammar corrections, and more.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2.5 bg-blue-500 text-white font-medium rounded-full text-sm hover:bg-blue-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Failed send — surfaced so the chat no longer just stalls silently */}
      {error && !isLoading && (
        <div
          className={`mx-4 mb-2 px-4 py-3 rounded-2xl border flex items-center gap-3 ${
            dark
              ? "bg-red-950/40 border-red-900/60 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="flex-1 text-xs leading-snug">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:scale-95 ${
                dark
                  ? "bg-red-900/50 text-red-200 hover:bg-red-900/70"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Hint / demo choice chips */}
      {hints.length > 0 && !isLoading && !conversationEnded && (
        <div className={`flex gap-2 px-4 py-2 overflow-x-auto border-t ${dark ? "border-gray-700" : "border-gray-100"}`}>
          {hints.map((hint, i) => (
            <button
              key={i}
              onClick={() => sendMessage(hint)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:scale-95 ${
                dark
                  ? "bg-blue-900/40 text-blue-300 hover:bg-blue-800/50"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* InputBar hidden in demo mode */}
      {!isDemoMode && (
        <InputBar onSend={sendMessage} disabled={isLoading} />
      )}

      {/* Word bank popup */}
      {!isDemoMode && popupMessage && popupAnchorRect && (
        <WordBankPopup
          messageContent={popupMessage.content}
          messageRole={popupMessage.role}
          scenarioId={scenario.id}
          scenarioTitle={scenario.title}
          language={settings.language}
          anchorRect={popupAnchorRect}
          onClose={closePopup}
        />
      )}

      {/* Word bank panel */}
      {!isDemoMode && showWordBank && (
        <WordBankPanel onClose={() => setShowWordBank(false)} />
      )}

      {/* Slang reference panel */}
      {!isDemoMode && showSlang && (
        <SlangPanel onClose={() => setShowSlang(false)} />
      )}
    </PhoneFrame>
  );
}

function AuthenticatedChat({ scenarioId }: { scenarioId: string }) {
  const { messages, isLoading, translatingId, hints, conversationEnded, reportCard, error, sendMessage, retryLastMessage, toggleTranslation, scenario } =
    useChat(scenarioId);
  const { t } = useTranslation();

  if (!scenario) {
    return (
      <PhoneFrame>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-500 mb-4">{t("scenarioNotFound")}</p>
            <Link href="/" className="text-blue-500 underline text-sm">
              {t("backToScenarios")}
            </Link>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <ChatContent
      messages={messages}
      isLoading={isLoading}
      translatingId={translatingId}
      hints={hints}
      conversationEnded={conversationEnded}
      reportCard={reportCard}
      sendMessage={sendMessage}
      toggleTranslation={toggleTranslation}
      scenario={scenario}
      isDemoMode={false}
      error={error}
      onRetry={retryLastMessage}
    />
  );
}

function DemoChat({ scenarioId }: { scenarioId: string }) {
  const { messages, isLoading, translatingId, hints, conversationEnded, reportCard, sendMessage, toggleTranslation, scenario } =
    useDemoChat(scenarioId);
  const { t } = useTranslation();

  if (!scenario) {
    return (
      <PhoneFrame>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-500 mb-4">{t("scenarioNotFound")}</p>
            <Link href="/" className="text-blue-500 underline text-sm">
              {t("backToScenarios")}
            </Link>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <ChatContent
      messages={messages}
      isLoading={isLoading}
      translatingId={translatingId}
      hints={hints}
      conversationEnded={conversationEnded}
      reportCard={reportCard}
      sendMessage={sendMessage}
      toggleTranslation={toggleTranslation}
      scenario={scenario}
      isDemoMode={true}
    />
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const { user } = useAuth();

  if (user) {
    return <AuthenticatedChat scenarioId={scenarioId} />;
  }

  return <DemoChat scenarioId={scenarioId} />;
}
