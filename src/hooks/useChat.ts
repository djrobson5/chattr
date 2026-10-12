"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Message, ReportCard } from "@/lib/types";
import { getScenario } from "@/lib/scenarios";
import { isPraiseCorrection } from "@/lib/report-card-utils";
import { useSettings } from "@/lib/settings-context";

function playSound(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
}

/**
 * Reports a browser-side failure to the durable log. Fire-and-forget: these
 * never reach the server logs on their own, and a failed report must not
 * compound the failure it is describing. `keepalive` lets it survive if the
 * learner navigates away immediately after.
 */
function reportClientFailure(event: string, detail: Record<string, unknown>) {
  try {
    fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, detail }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function describeFailure(status: number): string {
  if (status === 401) {
    return "Your session expired. Sign in again to keep chatting.";
  }
  if (status === 502) {
    return "The reply came back empty. Tap retry to try again.";
  }
  return "Something went wrong generating a reply. Tap retry to try again.";
}

export function useChat(scenarioId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hintsUsedCount = useRef(0);
  // Kept so a failed send can be retried without re-appending the user's message.
  const lastAttempt = useRef<{ userMsgId: string; history: Message[] } | null>(null);
  const { settings } = useSettings();

  const scenario = getScenario(scenarioId);

  const hintModeActive = settings.hintMode && settings.difficulty === "beginner";

  // Load starter message on mount
  useEffect(() => {
    if (scenario) {
      setMessages([
        {
          id: "starter",
          role: "assistant",
          content: scenario.starterMessage,
        },
      ]);
    }
  }, [scenario]);

  // Fetch initial hints for the starter message
  useEffect(() => {
    if (!scenario || !hintModeActive) {
      setHints([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId }),
        });
        const data = await res.json();
        if (!cancelled && data.hints?.length) {
          setHints(data.hints);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [scenario, scenarioId, hintModeActive]);

  // Fetch report card when conversation ends
  useEffect(() => {
    if (!conversationEnded || !scenario) return;

    const userMessages = messages.filter((m) => m.role === "user");
    const correctionsReceived = messages.filter(
      (m) => m.correction && !isPraiseCorrection(m.correction)
    ).length;

    const stats = {
      totalExchanges: userMessages.length,
      correctionsReceived,
      hintsUsed: hintsUsedCount.current,
    };

    setReportCard({ stats, feedback: null, isLoading: true });

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/report-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId,
            difficulty: settings.difficulty,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
              correction: m.correction,
            })),
            stats,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.feedback) {
          setReportCard({ stats, feedback: data.feedback, isLoading: false });
        } else {
          setReportCard({ stats, feedback: null, isLoading: false, error: data.error || "Failed to generate feedback" });
          reportClientFailure("client.report_card_failed", {
            route: "/api/report-card",
            status: res.status,
            scenarioId,
            totalExchanges: stats.totalExchanges,
          });
        }
      } catch {
        if (!cancelled) {
          setReportCard({ stats, feedback: null, isLoading: false, error: "Failed to generate feedback" });
          reportClientFailure("client.report_card_failed", {
            route: "/api/report-card",
            scenarioId,
            totalExchanges: stats.totalExchanges,
            networkError: true,
          });
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationEnded]);

  // Issues the request for an already-appended user message, so that a retry
  // can reuse the same history instead of duplicating the message.
  const deliver = useCallback(
    async (userMsgId: string, history: Message[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId,
            difficulty: settings.difficulty,
            correctionMode: settings.correctionMode,
            hintMode: settings.hintMode && settings.difficulty === "beginner",
            userMessage: history[history.length - 1]?.content,
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        if (data.reply) {
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
          };

          // Attach correction to the user message
          if (data.correction) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMsgId
                  ? { ...m, correction: data.correction }
                  : m
              )
            );
          }

          setMessages((prev) => [...prev, assistantMsg]);

          if (settings.soundEnabled) {
            playSound("/sounds/received.wav");
          }

          if (data.hints?.length) {
            setHints(data.hints);
          }

          if (data.conversationEnded) {
            setConversationEnded(true);
            setHints([]);
          }
        } else {
          // Every failure mode lands here — empty model output, 401 once a
          // session expires, 500 from the route. Previously this branch did
          // not exist and the chat simply stopped advancing, silently.
          console.error(
            `[chat] No reply — status=${res.status} ${res.statusText}`,
            data
          );
          setError(describeFailure(res.status));
          reportClientFailure("client.chat_no_reply", {
            route: "/api/chat",
            status: res.status,
            scenarioId,
            historyLength: history.length,
            difficulty: settings.difficulty,
            // Echoed back from the route's 502 payload when present.
            finishReason: data?.diagnostic?.finishReason ?? null,
            thoughtTokens: data?.diagnostic?.usage?.thoughts ?? null,
            candidateTokens: data?.diagnostic?.usage?.candidates ?? null,
          });
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Couldn't reach the server. Check your connection and try again.");
        reportClientFailure("client.chat_network_error", {
          route: "/api/chat",
          scenarioId,
          historyLength: history.length,
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [scenarioId, settings.difficulty, settings.correctionMode, settings.hintMode, settings.soundEnabled]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!scenario || isLoading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      if (hints.includes(text)) {
        hintsUsedCount.current += 1;
      }

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setHints([]);
      setConversationEnded(false);

      if (settings.soundEnabled) {
        playSound("/sounds/sent.wav");
      }

      lastAttempt.current = { userMsgId: userMsg.id, history: updatedMessages };
      await deliver(userMsg.id, updatedMessages);
    },
    [scenario, messages, isLoading, hints, settings.soundEnabled, deliver]
  );

  const retryLastMessage = useCallback(() => {
    const attempt = lastAttempt.current;
    if (!attempt || isLoading) return;
    deliver(attempt.userMsgId, attempt.history);
  }, [deliver, isLoading]);

  const isEnglish = scenario?.language === "english";

  const toggleTranslation = useCallback(
    async (id: string) => {
      if (isEnglish) return;

      const msg = messages.find((m) => m.id === id);
      if (!msg) return;

      // If already has translation, just toggle visibility
      if (msg.translation) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, showTranslation: !m.showTranslation } : m
          )
        );
        return;
      }

      // Fetch translation
      setTranslatingId(id);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: msg.content, language: scenario?.language }),
        });

        const data = await res.json();

        if (data.translation) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, translation: data.translation, showTranslation: true }
                : m
            )
          );
        }
      } catch (error) {
        console.error("Failed to translate:", error);
        reportClientFailure("client.translate_failed", {
          route: "/api/translate",
          language: scenario?.language ?? null,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setTranslatingId(null);
      }
    },
    [messages, scenario?.language, isEnglish]
  );

  return {
    messages,
    isLoading,
    translatingId,
    hints,
    conversationEnded,
    reportCard,
    error,
    sendMessage,
    retryLastMessage,
    toggleTranslation,
    scenario,
  };
}
