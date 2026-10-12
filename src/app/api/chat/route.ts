import { NextRequest, NextResponse } from "next/server";
import { getLanguageName, getScenario, getSystemPromptWithDifficulty } from "@/lib/scenarios";
import { chatWithGeminiDetailed, CHAT_MAX_OUTPUT_TOKENS } from "@/lib/gemini";
import { buildCorrectionInstruction } from "@/lib/chat-prompts";
import { ChatRequest } from "@/lib/types";
import { requireAuth } from "@/lib/auth-guard";
import { logEvent } from "@/lib/debug-log";

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    userId = auth.user.id;

    const {
      scenarioId,
      messages,
      difficulty = "intermediate",
      correctionMode = false,
      hintMode = false,
      userMessage,
    }: ChatRequest = await req.json();

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
    }

    let systemPrompt = getSystemPromptWithDifficulty(scenario, difficulty);
    const lang = getLanguageName(scenario.language);

    if (correctionMode && userMessage) {
      systemPrompt += buildCorrectionInstruction(lang);
    }

    if (hintMode) {
      systemPrompt += `\n\nAfter your reply (and after any correction line), add a new line starting with "💡 " followed by exactly 3 short suggested replies the user could send back, separated by " | ". IMPORTANT: The suggestions must directly answer or respond to the question or statement in YOUR reply. For example, if you ask what time, the suggestions should be times; if you ask which movie, suggest kinds of movies. Never suggest goodbyes unless your message is a goodbye. Write the suggestions in ${lang} and keep each one simple (3-6 words, beginner level).`;
    }

    const result = await chatWithGeminiDetailed(
      systemPrompt,
      messages,
      CHAT_MAX_OUTPUT_TOKENS,
      "chat"
    );
    const reply = result.text;

    // TEMPORARY INSTRUMENTATION — an empty generation used to fall through as a
    // 200 with reply:"", which the client silently discarded. Surface it instead.
    if (!reply) {
      console.error(
        `[chat] EMPTY REPLY — scenario=${scenarioId} history=${messages.length} ` +
          `difficulty=${difficulty} correction=${correctionMode} hint=${hintMode} ` +
          `finishReason=${result.finishReason ?? "none"} ` +
          `thoughts=${result.usage.thoughts ?? "?"} prompt=${result.usage.prompt ?? "?"}`
      );
      await logEvent({
        level: "error",
        event: "chat.empty_reply",
        route: "/api/chat",
        userId,
        detail: {
          scenarioId,
          difficulty,
          correctionMode,
          hintMode,
          budget: CHAT_MAX_OUTPUT_TOKENS,
          historyLength: messages.length,
          finishReason: result.finishReason ?? null,
          promptTokens: result.usage.prompt ?? null,
          thoughtTokens: result.usage.thoughts ?? null,
          candidateTokens: result.usage.candidates ?? null,
        },
      });
      return NextResponse.json(
        {
          error: "Model returned no text",
          diagnostic: {
            finishReason: result.finishReason,
            usage: result.usage,
            budget: CHAT_MAX_OUTPUT_TOKENS,
            historyLength: messages.length,
          },
        },
        { status: 502 }
      );
    }

    // Parse out structured parts
    let mainReply = reply;
    let correction: string | undefined;
    let hints: string[] | undefined;
    let conversationEnded = false;

    // Detect conversation end marker
    if (mainReply.includes("[CONV_END]")) {
      mainReply = mainReply.replace(/\[CONV_END\]/g, "").trim();
      conversationEnded = true;
    }

    // Extract hints first (comes last in the output)
    if (hintMode && mainReply.includes("💡")) {
      const parts = mainReply.split("💡");
      mainReply = parts[0].trim();
      const hintsRaw = parts[1]?.trim();
      if (hintsRaw) {
        hints = hintsRaw.split("|").map((h) => h.trim()).filter(Boolean);
      }
    }

    // Extract correction
    if (correctionMode && mainReply.includes("📝")) {
      const parts = mainReply.split("📝");
      mainReply = parts[0].trim();
      correction = parts[1]?.trim();
    }

    return NextResponse.json({ reply: mainReply, correction, hints, conversationEnded });
  } catch (error) {
    console.error("Chat API error:", error);
    await logEvent({
      level: "error",
      event: "chat.exception",
      route: "/api/chat",
      userId,
      detail: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : null,
      },
    });
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
