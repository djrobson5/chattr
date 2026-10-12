import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { logEvent } from "@/lib/debug-log";
import { auth } from "@/lib/auth";

/**
 * Client-side failure reporting.
 *
 * Browser-side failures — a dropped connection, a 401 after the session
 * expires — never reach the server logs at all, so the client reports them
 * here. This endpoint deliberately does NOT require auth: an expired session is
 * exactly the case worth capturing, and requiring a valid one would discard it.
 *
 * Because it is unauthenticated, the event name is checked against an allowlist
 * and the payload is flattened to bounded scalars before it is stored.
 */
const ALLOWED_EVENTS = new Set([
  "client.chat_no_reply",
  "client.chat_network_error",
  "client.translate_failed",
  "client.report_card_failed",
]);

const MAX_KEYS = 20;
const MAX_STRING_CHARS = 200;

/**
 * Keeps only bounded scalars. Nested objects and arrays are dropped outright,
 * which also stops message content from being smuggled into the log.
 */
function sanitize(detail: unknown): Record<string, unknown> {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return {};

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_KEYS) break;
    if (typeof value === "string") {
      out[key.slice(0, 40)] = value.slice(0, MAX_STRING_CHARS);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key.slice(0, 40)] = value;
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body?.event;

    if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    const detail = sanitize(body?.detail);

    // Attach the user when there is one, but never require it.
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      userId = session?.user?.id ?? null;
    } catch {
      // An unreadable session is itself unremarkable here — log it anonymously.
    }

    await logEvent({
      level: "error",
      event,
      source: "client",
      route: typeof detail.route === "string" ? detail.route : undefined,
      userId,
      detail,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
