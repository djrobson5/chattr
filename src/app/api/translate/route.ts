import { NextRequest, NextResponse } from "next/server";
import { translateToEnglish } from "@/lib/gemini";
import { TranslateRequest } from "@/lib/types";
import { requireAuth } from "@/lib/auth-guard";
import { logEvent } from "@/lib/debug-log";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { text, language }: TranslateRequest = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const translation = await translateToEnglish(text, language);

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Translate API error:", error);
    await logEvent({
      level: "error",
      event: "translate.exception",
      route: "/api/translate",
      detail: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : null,
      },
    });
    return NextResponse.json(
      { error: "Failed to translate" },
      { status: 500 }
    );
  }
}
