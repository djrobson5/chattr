import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Model selection. All of these env vars are optional; with none set, every
 * route uses gemini-2.5-flash with thinkingBudget 0 and the base token caps.
 * Read once at module load. An empty string counts as unset.
 */
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Model for chat, hints and translate. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;

/** Model for the report card. */
export const FEEDBACK_MODEL = process.env.GEMINI_FEEDBACK_MODEL || DEFAULT_MODEL;

export type ThinkingSetting = "off" | "minimal" | "low" | "medium" | "high";

const THINKING_LEVELS = ["minimal", "low", "medium", "high"] as const;

function parseFeedbackThinking(raw: string | undefined): ThinkingSetting {
  if (!raw) return "off";
  const value = raw.trim().toLowerCase();
  if ((THINKING_LEVELS as readonly string[]).includes(value)) {
    return value as ThinkingSetting;
  }
  console.warn(
    `[gemini] Ignoring GEMINI_FEEDBACK_THINKING="${raw}" — expected one of ` +
      `${THINKING_LEVELS.join("|")}. Report-card thinking stays off.`
  );
  return "off";
}

/** Report-card thinking. Unset means off, as before. */
export const FEEDBACK_THINKING = parseFeedbackThinking(
  process.env.GEMINI_FEEDBACK_THINKING
);

/** Models whose lowest thinking level is LOW (verified for 3.8 on 2026-10-09). */
const NO_MINIMAL_THINKING = ["gemini-3.7-flash", "gemini-3.8-flash"];

function isGemini25(model: string): boolean {
  return model.startsWith("gemini-2.5");
}

/**
 * gemini-2.5 controls thinking with a token budget; 3.x models use levels.
 *
 * - 2.5, off  → { thinkingBudget: 0 } (the original production config).
 * - 2.5, on   → budget mapping: minimal 512, low 1024, medium 4096, high 8192.
 * - 3.x, off  → { thinkingLevel: MINIMAL }. 3.x cannot fully disable thinking,
 *               MINIMAL is the closest equivalent.
 * - 3.x, on   → the requested thinkingLevel.
 */
export function thinkingConfigFor(
  model: string,
  setting: ThinkingSetting
): ThinkingConfig {
  if (isGemini25(model)) {
    const budgets: Record<ThinkingSetting, number> = {
      off: 0,
      minimal: 512,
      low: 1024,
      medium: 4096,
      high: 8192,
    };
    return { thinkingBudget: budgets[setting] };
  }
  // 3.7 and 3.8 Flash reject MINIMAL with a 400 ("Thinking level MINIMAL is
  // not supported for this model"), so LOW is their floor.
  const floor = NO_MINIMAL_THINKING.some((prefix) => model.startsWith(prefix))
    ? ThinkingLevel.LOW
    : ThinkingLevel.MINIMAL;
  const levels: Record<ThinkingSetting, ThinkingLevel> = {
    off: floor,
    minimal: floor,
    low: ThinkingLevel.LOW,
    medium: ThinkingLevel.MEDIUM,
    high: ThinkingLevel.HIGH,
  };
  return { thinkingLevel: levels[setting] };
}

/**
 * Thinking tokens count against maxOutputTokens (see `inspect` below), so any
 * model that may think needs more headroom. Caps are upper bounds, not spend,
 * so raising them costs nothing when the model stops early. The original
 * values apply only on the default 2.5 / no-thinking path.
 */
const THINKING_CHAT_FLOOR = 1024;

function chatOutputCap(model: string, requested: number): number {
  return isGemini25(model) ? requested : Math.max(requested, THINKING_CHAT_FLOOR);
}

/** Room for the report-card JSON body. */
export const FEEDBACK_MAX_OUTPUT_TOKENS =
  isGemini25(FEEDBACK_MODEL) && FEEDBACK_THINKING === "off" ? 2048 : 8192;

const CHAT_THINKING = thinkingConfigFor(GEMINI_MODEL, "off");
const FEEDBACK_THINKING_CONFIG = thinkingConfigFor(FEEDBACK_MODEL, FEEDBACK_THINKING);

type RawResponse = Awaited<ReturnType<typeof ai.models.generateContent>>;

export interface GeminiResult {
  text: string;
  finishReason?: string;
  usage: {
    prompt?: number;
    thoughts?: number;
    candidates?: number;
    total?: number;
  };
}

/**
 * TEMPORARY INSTRUMENTATION — logs why a generation came back empty.
 *
 * gemini-2.5-flash has thinking enabled by default, and thinking tokens count
 * against maxOutputTokens. A small budget can therefore be consumed entirely by
 * reasoning, returning finishReason MAX_TOKENS with zero visible text and no
 * error. Watch for `thoughts` approaching the budget while `candidates` is 0.
 *
 * Grep the logs for "[gemini]".
 */
function inspect(
  response: RawResponse,
  label: string,
  budget: number,
  model: string
): GeminiResult {
  const meta = response.usageMetadata;
  const usage = {
    prompt: meta?.promptTokenCount,
    thoughts: meta?.thoughtsTokenCount,
    candidates: meta?.candidatesTokenCount,
    total: meta?.totalTokenCount,
  };
  const finishReason = response.candidates?.[0]?.finishReason;
  const text = response.text ?? "";

  const n = (v?: number) => (v === undefined ? "?" : String(v));

  console.log(
    `[gemini] ${label} model=${model} budget=${budget} finishReason=${finishReason ?? "none"} ` +
      `prompt=${n(usage.prompt)} thoughts=${n(usage.thoughts)} ` +
      `candidates=${n(usage.candidates)} total=${n(usage.total)} chars=${text.length}`
  );

  if (!text) {
    console.error(
      `[gemini] ${label} EMPTY OUTPUT — finishReason=${finishReason ?? "none"}, ` +
        `thinking used ${n(usage.thoughts)} of the ${budget}-token budget, ` +
        `leaving ${n(usage.candidates)} for visible text`
    );
  }

  return { text, finishReason, usage };
}

/**
 * gemini-2.5-flash reasons before answering by default, and those thinking
 * tokens are billed against maxOutputTokens. Left on, a long conversation
 * eventually spends the whole budget thinking and returns no visible text at
 * all. Roleplay replies don't need reasoning, so it's disabled outright —
 * which also makes replies faster and cheaper. Valid range is 0–24576.
 * (`CHAT_THINKING` above resolves to { thinkingBudget: 0 } on 2.5.)
 */

/**
 * Room for a reply plus an optional correction line and three hint chips.
 * 512 on the default 2.5 path; 1024 on models that may think.
 */
export const CHAT_MAX_OUTPUT_TOKENS = chatOutputCap(GEMINI_MODEL, 512);

export async function chatWithGeminiDetailed(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxOutputTokens: number = CHAT_MAX_OUTPUT_TOKENS,
  label: string = "chat"
): Promise<GeminiResult> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const cap = chatOutputCap(GEMINI_MODEL, maxOutputTokens);
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: cap,
      thinkingConfig: CHAT_THINKING,
    },
  });

  return inspect(response, label, cap, GEMINI_MODEL);
}

export async function chatWithGemini(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxOutputTokens: number = CHAT_MAX_OUTPUT_TOKENS,
  label: string = "chat"
): Promise<string> {
  const result = await chatWithGeminiDetailed(
    systemPrompt,
    messages,
    maxOutputTokens,
    label
  );
  return result.text;
}

export async function translateToEnglish(text: string, language: string = "italian"): Promise<string> {
  const langName = language.charAt(0).toUpperCase() + language.slice(1);
  const cap = chatOutputCap(GEMINI_MODEL, 1024);
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Translate the following ${langName} text to English. Return ONLY the English translation, nothing else.\n\n${text}`,
    config: {
      maxOutputTokens: cap,
      thinkingConfig: CHAT_THINKING,
    },
  });

  return inspect(response, "translate", cap, GEMINI_MODEL).text;
}

/**
 * One report-card generation attempt. The retry loop and JSON parse/validate
 * stay in the route; this only owns the request config.
 */
export async function generateFeedbackContent(
  systemPrompt: string,
  transcript: string
): Promise<RawResponse> {
  const response = await ai.models.generateContent({
    model: FEEDBACK_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: `Here is the conversation transcript:\n\n${transcript}` }],
      },
    ],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: FEEDBACK_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      // Same starvation risk as the chat route: thinking tokens count
      // against maxOutputTokens and can leave nothing for the JSON body.
      thinkingConfig: FEEDBACK_THINKING_CONFIG,
    },
  });

  const meta = response.usageMetadata;
  console.log(
    `[gemini] report-card model=${FEEDBACK_MODEL} thinking=${FEEDBACK_THINKING} ` +
      `budget=${FEEDBACK_MAX_OUTPUT_TOKENS} finishReason=${response.candidates?.[0]?.finishReason ?? "none"} ` +
      `prompt=${meta?.promptTokenCount ?? "?"} thoughts=${meta?.thoughtsTokenCount ?? "?"} ` +
      `candidates=${meta?.candidatesTokenCount ?? "?"}`
  );
  return response;
}
