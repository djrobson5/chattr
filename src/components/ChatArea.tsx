"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";
import ChatBubble from "./ChatBubble";

export default function ChatArea({
  messages,
  onTapMessage,
  onLongPressMessage,
  translatingId,
  isLoading,
  footer,
}: {
  messages: Message[];
  onTapMessage: (id: string) => void;
  onLongPressMessage?: (id: string, rect: DOMRect) => void;
  translatingId: string | null;
  isLoading: boolean;
  /** Rendered inline after the last message, e.g. the end-of-conversation report card. */
  footer?: ReactNode;
}) {
  const { settings } = useSettings();
  const dark = settings.darkMode;
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const hasFooter = Boolean(footer);

  useEffect(() => {
    // With a footer (report card) showing, scrolling to the bottom would push
    // the final message out of view. Pin the last message to the top instead,
    // so it stays readable with the card starting right below it.
    if (hasFooter) {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, hasFooter]);

  // Scroll to bottom when the virtual keyboard opens/closes (viewport resize)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function onResize() {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {messages.map((msg, idx) => (
        <div key={msg.id} ref={idx === messages.length - 1 ? lastMessageRef : undefined}>
          <ChatBubble
            message={msg}
            onTap={() => onTapMessage(msg.id)}
            onLongPress={
              onLongPressMessage
                ? (rect) => onLongPressMessage(msg.id, rect)
                : undefined
            }
            isTranslating={translatingId === msg.id}
            delivered={
              msg.role === "user"
                ? messages.slice(idx + 1).some((m) => m.role === "assistant")
                : undefined
            }
          />
        </div>
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex justify-start mb-2">
          <div className={`${dark ? "bg-gray-700" : "bg-gray-200"} px-4 py-3 rounded-2xl rounded-bl-md`}>
            <div className="flex gap-1">
              <span className={`w-2 h-2 ${dark ? "bg-gray-500" : "bg-gray-400"} rounded-full animate-bounce [animation-delay:0ms]`} />
              <span className={`w-2 h-2 ${dark ? "bg-gray-500" : "bg-gray-400"} rounded-full animate-bounce [animation-delay:150ms]`} />
              <span className={`w-2 h-2 ${dark ? "bg-gray-500" : "bg-gray-400"} rounded-full animate-bounce [animation-delay:300ms]`} />
            </div>
          </div>
        </div>
      )}

      {footer}

      <div ref={bottomRef} />
    </div>
  );
}
