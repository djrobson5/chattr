"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { useSettings } from "@/lib/settings-context";
import { useWordBank } from "@/lib/word-bank-context";
import { useTranslation } from "@/hooks/useTranslation";

interface WordBankPopupProps {
  messageContent: string;
  messageRole: "user" | "assistant";
  scenarioId: string;
  scenarioTitle: string;
  language: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function WordBankPopup({
  messageContent,
  messageRole,
  scenarioId,
  scenarioTitle,
  language,
  anchorRect,
  onClose,
}: WordBankPopupProps) {
  const { settings } = useSettings();
  const { addEntry, hasWord } = useWordBank();
  const { t } = useTranslation();
  const dark = settings.darkMode;

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top?: number; bottom?: number }>({
    bottom: 8,
  });

  // Calculate position relative to this container, not the viewport
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const POPUP_HEIGHT = 260;
    const GAP = 8;

    // Convert anchor from viewport coords to container-relative coords
    const anchorBottomRel = anchorRect.bottom - containerRect.top;
    const anchorTopRel = anchorRect.top - containerRect.top;
    const containerHeight = containerRect.height;

    // Try below the bubble first
    if (anchorBottomRel + GAP + POPUP_HEIGHT <= containerHeight) {
      setPosition({ top: anchorBottomRel + GAP });
    }
    // Try above the bubble
    else if (anchorTopRel - GAP - POPUP_HEIGHT >= 0) {
      setPosition({ top: anchorTopRel - GAP - POPUP_HEIGHT });
    }
    // Not enough space either way — pin to bottom with padding
    else {
      setPosition({ bottom: GAP });
    }
  }, [anchorRect]);

  // Split message into words — use Intl.Segmenter for CJK languages
  // that don't use spaces between words
  const words = (() => {
    const cjkLanguages: Record<string, string> = {
      chinese: "zh",
      japanese: "ja",
      korean: "ko",
    };
    const locale = cjkLanguages[language];
    if (locale && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
      return Array.from(segmenter.segment(messageContent))
        .filter((seg) => seg.isWordLike)
        .map((seg) => seg.segment);
    }
    return messageContent.split(/\s+/).filter(Boolean);
  })();

  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleWordTap = useCallback(
    (idx: number) => {
      if (!selectedRange) {
        setSelectedRange([idx, idx]);
      } else if (selectedRange[0] === idx && selectedRange[1] === idx) {
        setSelectedRange(null);
      } else {
        const start = Math.min(selectedRange[0], idx);
        const end = Math.max(selectedRange[0], idx);
        setSelectedRange([start, end]);
      }
    },
    [selectedRange]
  );

  const cjk = ["chinese", "japanese", "korean"].includes(language);
  const selectedText =
    selectedRange !== null
      ? words.slice(selectedRange[0], selectedRange[1] + 1).join(cjk ? "" : " ")
      : "";

  const alreadySaved = selectedText ? hasWord(selectedText, language) : false;

  const handleSave = useCallback(async () => {
    if (!selectedText) return;
    setSaving(true);

    let translation = "";
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, language }),
      });
      if (res.ok) {
        const data = await res.json();
        translation = data.translation ?? "";
      }
    } catch {}

    if (!translation) {
      translation = "(translation unavailable)";
    }

    await addEntry({
      word: selectedText,
      translation,
      contextMessage: messageContent,
      contextRole: messageRole,
      scenarioId,
      scenarioTitle,
      language,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => onClose(), 800);
  }, [
    selectedText,
    language,
    messageContent,
    messageRole,
    scenarioId,
    scenarioTitle,
    addEntry,
    onClose,
  ]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Popup */}
      <div
        className={`absolute left-4 right-4 rounded-xl shadow-xl border flex flex-col ${
          dark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        style={{
          ...(position.top !== undefined ? { top: position.top } : {}),
          ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
          maxHeight: 260,
        }}
      >
        {saved ? (
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <span className="text-3xl">✓</span>
              <p
                className={`text-sm mt-1 font-medium ${
                  dark ? "text-green-400" : "text-green-600"
                }`}
              >
                {t("wordBankSaved")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p
              className={`text-xs px-3 pt-3 pb-1 shrink-0 ${
                dark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {t("wordBankSelectWord")}
            </p>

            {/* Word chips — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {words.map((word, idx) => {
                  const isSelected =
                    selectedRange !== null &&
                    idx >= selectedRange[0] &&
                    idx <= selectedRange[1];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleWordTap(idx)}
                      className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : dark
                          ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions — always visible */}
            <div
              className={`flex items-center justify-between px-3 py-2.5 shrink-0 border-t ${
                dark ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <button
                onClick={onClose}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  dark
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t("wordBankCancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedText || saving || alreadySaved}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  selectedText && !saving && !alreadySaved
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : dark
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {saving
                  ? "..."
                  : alreadySaved
                  ? "✓"
                  : t("wordBankSave")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
