"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import type { WordBankEntry } from "@/lib/types";

interface WordBankContextValue {
  entries: WordBankEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<WordBankEntry, "id" | "createdAt">) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  hasWord: (word: string, language: string) => boolean;
}

const WordBankContext = createContext<WordBankContextValue>({
  entries: [],
  isLoading: false,
  addEntry: async () => {},
  removeEntry: async () => {},
  hasWord: () => false,
});

const LOCAL_KEY = "wordBank";

function readLocal(): WordBankEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: WordBankEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function WordBankProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WordBankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const prevUser = useRef<string | null>(null);

  // Fetch entries on mount / auth change
  useEffect(() => {
    let cancelled = false;

    if (user) {
      setIsLoading(true);
      const migrateAndFetch = async () => {
        // Migrate localStorage entries if transitioning from guest
        const localEntries = readLocal();
        if (localEntries.length > 0 && prevUser.current === null) {
          for (const entry of localEntries) {
            if (cancelled) return;
            try {
              await fetch("/api/word-bank", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  word: entry.word,
                  translation: entry.translation,
                  contextMessage: entry.contextMessage,
                  contextRole: entry.contextRole,
                  scenarioId: entry.scenarioId,
                  scenarioTitle: entry.scenarioTitle,
                  language: entry.language,
                }),
              });
            } catch {}
          }
          if (cancelled) return;
          localStorage.removeItem(LOCAL_KEY);
        }

        // Fetch all from server
        try {
          const res = await fetch("/api/word-bank");
          if (!cancelled && res.ok) {
            const data = await res.json();
            setEntries(data.entries ?? []);
          }
        } catch {}
        if (!cancelled) setIsLoading(false);
      };
      migrateAndFetch();
      prevUser.current = user.id;
    } else {
      // Signed out — clear server entries immediately
      setEntries(readLocal());
      setIsLoading(false);
      prevUser.current = null;
    }

    return () => { cancelled = true; };
  }, [user]);

  const addEntry = useCallback(
    async (entry: Omit<WordBankEntry, "id" | "createdAt">) => {
      if (user) {
        // Optimistic add
        const tempId = crypto.randomUUID();
        const optimistic: WordBankEntry = {
          ...entry,
          id: tempId,
          createdAt: new Date().toISOString(),
        };
        setEntries((prev) => [optimistic, ...prev]);

        try {
          const res = await fetch("/api/word-bank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          });
          if (res.ok) {
            const data = await res.json();
            setEntries((prev) =>
              prev.map((e) => (e.id === tempId ? data.entry : e))
            );
          } else {
            // Rollback
            setEntries((prev) => prev.filter((e) => e.id !== tempId));
          }
        } catch {
          setEntries((prev) => prev.filter((e) => e.id !== tempId));
        }
      } else {
        // Guest: localStorage
        const newEntry: WordBankEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        setEntries((prev) => {
          const next = [newEntry, ...prev];
          writeLocal(next);
          return next;
        });
      }
    },
    [user]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (user) {
        const removed = entries.find((e) => e.id === id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
        try {
          const res = await fetch("/api/word-bank", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
          if (!res.ok && removed) {
            setEntries((prev) => [...prev, removed]);
          }
        } catch {
          if (removed) setEntries((prev) => [...prev, removed]);
        }
      } else {
        setEntries((prev) => {
          const next = prev.filter((e) => e.id !== id);
          writeLocal(next);
          return next;
        });
      }
    },
    [user, entries]
  );

  const hasWord = useCallback(
    (word: string, language: string) => {
      const lower = word.toLowerCase();
      return entries.some(
        (e) => e.word.toLowerCase() === lower && e.language === language
      );
    },
    [entries]
  );

  return (
    <WordBankContext.Provider
      value={{ entries, isLoading, addEntry, removeEntry, hasWord }}
    >
      {children}
    </WordBankContext.Provider>
  );
}

export function useWordBank() {
  return useContext(WordBankContext);
}
