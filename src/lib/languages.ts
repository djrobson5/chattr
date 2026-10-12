export interface Language {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  placeholder: string;
  translatePrompt: string;
}

export const languages: Language[] = [
  {
    id: "english",
    name: "English",
    nativeName: "English",
    flag: "EN",
    placeholder: "Type a message...",
    translatePrompt: "",
  },
  {
    id: "italian",
    name: "Italian",
    nativeName: "Italiano",
    flag: "IT",
    placeholder: "Scrivi un messaggio...",
    translatePrompt: "Translate the following Italian text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "spanish",
    name: "Spanish",
    nativeName: "Espa\u00f1ol",
    flag: "ES",
    placeholder: "Escribe un mensaje...",
    translatePrompt: "Translate the following Spanish text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "french",
    name: "French",
    nativeName: "Fran\u00e7ais",
    flag: "FR",
    placeholder: "\u00c9cris un message...",
    translatePrompt: "Translate the following French text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "german",
    name: "German",
    nativeName: "Deutsch",
    flag: "DE",
    placeholder: "Schreibe eine Nachricht...",
    translatePrompt: "Translate the following German text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "chinese",
    name: "Chinese (Mandarin)",
    nativeName: "中文",
    flag: "ZH",
    placeholder: "输入消息...",
    translatePrompt: "Translate the following Mandarin Chinese text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "japanese",
    name: "Japanese",
    nativeName: "日本語",
    flag: "JP",
    placeholder: "メッセージを入力...",
    translatePrompt: "Translate the following Japanese text to English. Return ONLY the English translation, nothing else.",
  },
  {
    id: "korean",
    name: "Korean",
    nativeName: "한국어",
    flag: "KR",
    placeholder: "메시지를 입력하세요...",
    translatePrompt: "Translate the following Korean text to English. Return ONLY the English translation, nothing else.",
  },
];

export function getLanguage(id: string): Language | undefined {
  return languages.find((l) => l.id === id);
}
