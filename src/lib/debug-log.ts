import { db } from "@/lib/db";
import { debugEvents } from "@/lib/db/schema";

export type DebugLevel = "error" | "warn" | "info";
export type DebugSource = "server" | "client";

export interface DebugEvent {
  level: DebugLevel;
  event: string;
  route?: string;
  source?: DebugSource;
  userId?: string | null;
  detail?: Record<string, unknown>;
}

const MAX_DETAIL_CHARS = 3500;

/**
 * Appends a diagnostic event to the debug_events table.
 *
 * Written to on failure only — never on the happy path. Beyond keeping the
 * table readable, this matters on Neon: every write wakes the compute and
 * bills against the monthly CU-hour allowance.
 *
 * Deliberately stores NO message content. Token counts, scenario ids, and
 * status codes are enough to diagnose; student conversations stay out of it.
 *
 * Swallows every error by design: a logging outage must never break a learner's
 * conversation. Callers should not await this for correctness.
 */
export async function logEvent(e: DebugEvent): Promise<void> {
  try {
    let detail = e.detail ?? {};
    if (JSON.stringify(detail).length > MAX_DETAIL_CHARS) {
      detail = { truncated: true };
    }

    await db.insert(debugEvents).values({
      level: e.level,
      event: e.event.slice(0, 64),
      source: e.source ?? "server",
      route: e.route?.slice(0, 128) ?? null,
      environment: process.env.VERCEL_ENV ?? "development",
      userId: e.userId ?? null,
      detail,
    });
  } catch (err) {
    console.error("[debug-log] failed to record event:", err);
  }
}
