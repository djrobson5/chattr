import { NextRequest, NextResponse } from "next/server";
import { getLanguageName, getScenario } from "@/lib/scenarios";
import { requireAuth } from "@/lib/auth-guard";
import { logEvent } from "@/lib/debug-log";
import {
  tryParseJSON,
  validateFeedback,
  ReportCardFeedback,
  isPraiseCorrection,
} from "@/lib/report-card-utils";
import { FEEDBACK_MODEL, generateFeedbackContent } from "@/lib/gemini";

async function generateFeedback(
  systemPrompt: string,
  transcript: string,
  maxAttempts: number = 2
): Promise<ReportCardFeedback> {
  let lastError = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await generateFeedbackContent(systemPrompt, transcript);

      const raw = response.text ?? "";
      const parsed = tryParseJSON(raw);
      if (parsed) return validateFeedback(parsed);

      const meta = response.usageMetadata;
      const finishReason = response.candidates?.[0]?.finishReason;
      lastError = `Unparseable response: ${raw.slice(0, 200)}`;
      console.warn(
        `[report-card] Attempt ${attempt + 1} failed to parse — model=${FEEDBACK_MODEL} ` +
          `finishReason=${finishReason ?? "none"} thoughts=${meta?.thoughtsTokenCount ?? "?"} ` +
          `candidates=${meta?.candidatesTokenCount ?? "?"} chars=${raw.length}:`,
        raw.slice(0, 300)
      );
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[report-card] Attempt ${attempt + 1} threw (model=${FEEDBACK_MODEL}):`,
        lastError
      );
    }
  }

  throw new Error(lastError);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { scenarioId, difficulty, messages, stats } = await req.json();

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
    }

    const lang = getLanguageName(scenario.language);

    // Include the in-chat corrections so the review can build on them.
    // "Perfect <Language>!" praise is left out — it is not a correction.
    const transcript = messages
      .map((m: { role: string; content: string; correction?: string }) => {
        const line = `${m.role === "user" ? "Learner" : scenario.character}: ${m.content}`;
        return m.role === "user" && m.correction && !isPraiseCorrection(m.correction)
          ? `${line}\n  [Correction shown to learner: ${m.correction}]`
          : line;
      })
      .join("\n");

    const systemPrompt = `You are a language tutor reviewing a student's conversation practice. The student was practicing ${lang} at ${difficulty} level in a "${scenario.title}" scenario.

Here are the student's stats:
- Total exchanges: ${stats.totalExchanges}
- Grammar corrections received: ${stats.correctionsReceived}
- Hints used: ${stats.hintsUsed}

Review the following conversation transcript and provide feedback. Respond with a JSON object using this exact structure:
{
  "goalAccomplished": true,
  "goalSummary": "One sentence about whether you achieved the scenario goal",
  "grammarAssessment": "1-2 short sentences about grammar usage",
  "vocabularyAssessment": "1-2 short sentences about vocabulary usage",
  "wellDone": ["thing 1", "thing 2"],
  "toImprove": ["thing 1", "thing 2"],
  "overallRating": 4
}

goalAccomplished must be true or false. overallRating must be an integer from 1 to 5.
IMPORTANT: Write ALL feedback text in English only — the student's native language is English. Do not write feedback in ${scenario.language}. Address the student directly as "you" in every field — never "the student". Base the grammar and vocabulary assessments on the learner's actual messages and any corrections shown in the transcript; do not invent mistakes, and judge informal texting style (abbreviations, lowercase, missing punctuation) as appropriate rather than as errors. Be encouraging but honest. Keep all text concise — each string value should be 1-2 sentences max. The "wellDone" and "toImprove" arrays should each have 1-3 short items.`;

    const feedback = await generateFeedback(systemPrompt, transcript);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[report-card] API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    await logEvent({
      level: "error",
      event: "report_card.exception",
      route: "/api/report-card",
      detail: {
        message,
        name: error instanceof Error ? error.name : null,
      },
    });
    return NextResponse.json(
      { error: `Report card error: ${message}` },
      { status: 500 }
    );
  }
}
