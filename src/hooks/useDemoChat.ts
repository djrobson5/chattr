"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { getScenario } from "@/lib/scenarios";
import { getDemoScript } from "@/lib/demo-scripts";
import { useSettings } from "@/lib/settings-context";

function playSound(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
}

export function useDemoChat(scenarioId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const stepIndex = useRef(0);
  const { settings } = useSettings();

  const scenario = getScenario(scenarioId);
  const demoScript = getDemoScript(scenarioId);

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
      stepIndex.current = 0;
      setConversationEnded(false);
    }
  }, [scenario]);

  const currentStep = demoScript?.steps[stepIndex.current] ?? null;
  const hints = currentStep && !conversationEnded ? currentStep.choices : [];

  const sendMessage = useCallback(
    (text: string) => {
      if (!scenario || !demoScript || isLoading || conversationEnded) return;

      const step = demoScript.steps[stepIndex.current];
      if (!step) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      if (settings.soundEnabled) {
        playSound("/sounds/sent.wav");
      }

      // Simulate typing delay
      setTimeout(() => {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: step.assistantReply,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);

        if (settings.soundEnabled) {
          playSound("/sounds/received.wav");
        }

        const nextStep = stepIndex.current + 1;
        stepIndex.current = nextStep;

        if (nextStep >= demoScript.steps.length) {
          setConversationEnded(true);
        }
      }, 800);
    },
    [scenario, demoScript, isLoading, conversationEnded, settings.soundEnabled]
  );

  const toggleTranslation = useCallback(
    (id: string) => {
      if (!demoScript) return;

      const msg = messages.find((m) => m.id === id);
      if (!msg || msg.role !== "assistant") return;

      // If already has translation, toggle visibility
      if (msg.translation) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, showTranslation: !m.showTranslation } : m
          )
        );
        return;
      }

      // Find the translation from the demo script
      let translation: string | undefined;

      // Check if it's the starter message
      if (id === "starter") {
        // Starter message for making-plans — the translation is just the English version
        const englishScenario = getScenario(`making-plans-english`);
        translation = englishScenario?.starterMessage;
      } else {
        // Find which step this assistant message corresponds to
        const assistantMessages = messages.filter((m) => m.role === "assistant" && m.id !== "starter");
        const msgIndex = assistantMessages.findIndex((m) => m.id === id);
        if (msgIndex >= 0 && demoScript.steps[msgIndex]) {
          translation = demoScript.steps[msgIndex].translation;
        }
      }

      if (translation) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, translation, showTranslation: true }
              : m
          )
        );
      }
    },
    [messages, demoScript]
  );

  return {
    messages,
    isLoading,
    translatingId: null,
    hints,
    conversationEnded,
    reportCard: null,
    sendMessage,
    toggleTranslation,
    scenario,
    isDemoMode: true as const,
  };
}
