export type Difficulty = "beginner" | "intermediate" | "advanced";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
  difficulty: Difficulty;
  darkMode: boolean;
  fontSize: FontSize;
  correctionMode: boolean;
  hintMode: boolean;
  language: string;
  soundEnabled: boolean;
  uiInTargetLanguage: boolean;
  slangReference: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  translation?: string;
  showTranslation?: boolean;
  correction?: string;
}

export interface Scenario {
  id: string;
  title: string;
  localizedTitle: string;
  category: "everyday" | "travel";
  character: string;
  localizedCharacter: string;
  emoji: string;
  starterMessage: string;
  systemPrompt: string;
  language: string;
}

export interface ChatRequest {
  scenarioId: string;
  messages: { role: string; content: string }[];
  difficulty: Difficulty;
  correctionMode: boolean;
  hintMode: boolean;
  userMessage?: string;
}

export interface WordBankEntry {
  id: string;
  word: string;
  translation: string;
  contextMessage: string;
  contextRole: "user" | "assistant";
  scenarioId: string;
  scenarioTitle: string;
  language: string;
  createdAt: string;
}

export interface TranslateRequest {
  text: string;
  language?: string;
}

export interface ReportCard {
  stats: {
    totalExchanges: number;
    correctionsReceived: number;
    hintsUsed: number;
  };
  feedback: {
    goalAccomplished: boolean;
    goalSummary: string;
    grammarAssessment: string;
    vocabularyAssessment: string;
    wellDone: string[];
    toImprove: string[];
    overallRating: number;
  } | null;
  isLoading: boolean;
  error?: string;
}
