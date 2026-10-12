"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useSettings } from "@/lib/settings-context";
import { getLanguage } from "@/lib/languages";

const emojis = [
  "😀", "😂", "😍", "🥰", "😊", "😎", "🤔", "😅",
  "😢", "😭", "😤", "🤣", "🥺", "😏", "🙄", "😴",
  "👍", "👎", "👋", "🙏", "💪", "🤝", "✌️", "🤷",
  "❤️", "🔥", "✨", "🎉", "💯", "👀", "🙈", "💀",
  "☕", "🍕", "🍷", "🍝", "✈️", "🏠", "📱", "⏰",
];

export default function InputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const lang = getLanguage(settings.language);
  const placeholder = lang?.placeholder ?? "Type a message...";
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close emoji panel on outside click
  useEffect(() => {
    if (!showEmojis) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showEmojis]);

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    setShowEmojis(false);
    // Clicking the send button moves focus to it, and the button then disables
    // itself (empty text), which drops focus entirely. Hand it back to the input.
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      {/* Emoji panel */}
      {showEmojis && (
        <div
          ref={panelRef}
          className={`absolute bottom-full left-0 right-0 border-t ${
            dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="grid grid-cols-8 gap-1 p-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className={`h-9 flex items-center justify-center rounded-lg text-xl transition-colors active:scale-90 ${
                  dark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 px-4 py-3 border-t ${dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}
      >
        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => setShowEmojis((v) => !v)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            showEmojis
              ? "bg-blue-500 text-white"
              : dark
              ? "text-gray-400 hover:bg-gray-800"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 5.157a.75.75 0 0 1-1.06 1.06 3.486 3.486 0 0 0-2.652-1.1 3.486 3.486 0 0 0-2.652 1.1.75.75 0 0 1-1.06-1.06A4.988 4.988 0 0 1 12 13a4.988 4.988 0 0 1 3.712 1.04Z" clipRule="evenodd" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          // Deliberately never disabled: a disabled input drops focus, so the
          // learner would have to click back in after every reply. While a
          // reply is pending, typing still works and handleSubmit blocks sending.
          className={`flex-1 px-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-300 ${
            dark
              ? "bg-gray-800 text-gray-100 placeholder-gray-500"
              : "bg-gray-100 text-gray-900 placeholder-gray-400"
          }`}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full disabled:opacity-40 transition-opacity active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
