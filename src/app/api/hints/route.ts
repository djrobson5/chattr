import { NextRequest, NextResponse } from "next/server";
import { getLanguageName, getScenario } from "@/lib/scenarios";
import { chatWithGemini } from "@/lib/gemini";
import { requireAuth } from "@/lib/auth-guard";
import { logEvent } from "@/lib/debug-log";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { scenarioId } = await req.json();

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
    }

    const lang = getLanguageName(scenario.language);

    const prompt = `You are helping a beginner ${lang} learner practice texting. They just received this message: "${scenario.starterMessage}". Suggest exactly 3 short, simple replies that directly answer or respond to what was said in that message (3-6 words each, beginner ${lang}). For example, if the message asks what they would like, suggest things to order. If it asks about a reservation, suggest answers about a reservation. Return ONLY the 3 suggestions separated by " | ". No numbering, no explanation.`;

    const response = await chatWithGemini(
      prompt,
      [{ role: "user", content: prompt }],
      256,
      "hints"
    );

    const hints = response
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);

    return NextResponse.json({ hints });
  } catch (error) {
    console.error("Hints API error:", error);
    await logEvent({
      level: "error",
      event: "hints.exception",
      route: "/api/hints",
      detail: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : null,
      },
    });
    return NextResponse.json(
      { error: "Failed to generate hints" },
      { status: 500 }
    );
  }
}
