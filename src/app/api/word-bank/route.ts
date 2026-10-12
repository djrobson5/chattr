import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wordBank } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-guard";
import { logEvent } from "@/lib/debug-log";
import type { WordBankEntry } from "@/lib/types";

type WordBankRow = typeof wordBank.$inferSelect;

function rowToEntry(row: WordBankRow): WordBankEntry {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    contextMessage: row.contextMessage,
    contextRole: row.contextRole as "user" | "assistant",
    scenarioId: row.scenarioId,
    scenarioTitle: row.scenarioTitle,
    language: row.language,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const language = req.nextUrl.searchParams.get("language");

    // Every query is scoped by the session's user id. With RLS gone, this is
    // the only thing preventing cross-user reads — do not drop it.
    const where = language
      ? and(eq(wordBank.userId, auth.user.id), eq(wordBank.language, language))
      : eq(wordBank.userId, auth.user.id);

    const rows = await db
      .select()
      .from(wordBank)
      .where(where)
      .orderBy(desc(wordBank.createdAt));

    return NextResponse.json({ entries: rows.map(rowToEntry) });
  } catch (error) {
    console.error("Word bank GET error:", error);
    await logEvent({
      level: "error",
      event: "word_bank.exception",
      route: "/api/word-bank",
      userId: auth.user.id,
      detail: { op: "GET", message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to fetch word bank" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { word, translation, contextMessage, contextRole, scenarioId, scenarioTitle, language } = body;

    if (!word || !translation) {
      return NextResponse.json({ error: "word and translation are required" }, { status: 400 });
    }

    const [row] = await db
      .insert(wordBank)
      .values({
        userId: auth.user.id,
        word,
        translation,
        contextMessage,
        contextRole,
        scenarioId,
        scenarioTitle,
        language,
      })
      .returning();

    return NextResponse.json({ entry: rowToEntry(row) });
  } catch (error) {
    console.error("Word bank POST error:", error);
    await logEvent({
      level: "error",
      event: "word_bank.exception",
      route: "/api/word-bank",
      userId: auth.user.id,
      detail: { op: "POST", message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to save word" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Matching on user id as well as row id keeps one user from deleting
    // another's entry by guessing a uuid.
    await db
      .delete(wordBank)
      .where(and(eq(wordBank.id, id), eq(wordBank.userId, auth.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Word bank DELETE error:", error);
    await logEvent({
      level: "error",
      event: "word_bank.exception",
      route: "/api/word-bank",
      userId: auth.user.id,
      detail: { op: "DELETE", message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
  }
}
