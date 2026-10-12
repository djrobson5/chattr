"use client";

import { useRef, useCallback } from "react";
import { Message, FontSize } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/hooks/useTranslation";

const fontSizeClass: Record<FontSize, string> = {
  small: "text-[13px]",
  medium: "text-[15px]",
  large: "text-[18px]",
};

export default function ChatBubble({
  message,
  onTap,
  onLongPress,
  isTranslating,
  delivered,
}: {
  message: Message;
  onTap: () => void;
  onLongPress?: (rect: DOMRect) => void;
  isTranslating?: boolean;
  delivered?: boolean;
}) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const dark = settings.darkMode;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      timerRef.current = null;
      if (onLongPress && btnRef.current) {
        onLongPress(btnRef.current.getBoundingClientRect());
      }
    }, 500);
  }, [onLongPress]);

  const handlePointerUp = useCallback(() => {
    clearTimer();
    if (!didLongPress.current) {
      onTap();
    }
  }, [clearTimer, onTap]);

  const handlePointerLeave = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div className="max-w-[75%]">
        <button
          ref={btnRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
          style={{ touchAction: "none" }}
          className={`px-4 py-2.5 rounded-2xl text-left ${fontSizeClass[settings.fontSize]} leading-snug transition-all active:scale-[0.98] ${
            isUser
              ? "bg-blue-500 text-white rounded-br-md"
              : dark
              ? "bg-gray-700 text-gray-100 rounded-bl-md"
              : "bg-gray-200 text-gray-900 rounded-bl-md"
          }`}
        >
          {message.content}
        </button>

        {/* Translation */}
        {isTranslating && (
          <p
            className={`text-xs italic mt-1 ${
              isUser ? "text-right" : "text-left"
            } px-2 ${dark ? "text-gray-500" : "text-gray-400"}`}
          >
            {t("translating")}
          </p>
        )}
        {message.showTranslation && message.translation && (
          <p
            className={`text-xs italic mt-1 ${
              isUser ? "text-right" : "text-left"
            } px-2 ${dark ? "text-gray-400" : "text-gray-500"}`}
          >
            {message.translation}
          </p>
        )}

        {/* Correction (shown below user messages) */}
        {isUser && message.correction && (
          <p className={`text-xs mt-1.5 px-2 text-right ${dark ? "text-amber-400" : "text-amber-600"}`}>
            📝 {message.correction}
          </p>
        )}

        {/* Read receipts on user messages */}
        {isUser && (
          <p className={`text-[10px] mt-0.5 px-2 text-right ${delivered ? "text-blue-500" : dark ? "text-gray-500" : "text-gray-400"}`}>
            {delivered ? "✓✓" : "✓"}
          </p>
        )}

        {/* Tap hint for assistant messages without translation (hidden for English) */}
        {!isUser && !message.showTranslation && !message.translation && settings.language !== "english" && (
          <p className={`text-[10px] mt-0.5 px-2 ${dark ? "text-gray-600" : "text-gray-400"}`}>
            {t("tapToTranslate")}
          </p>
        )}
      </div>
    </div>
  );
}
