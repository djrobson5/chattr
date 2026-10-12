import { pgTable, text, timestamp, boolean, uuid, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Better Auth core schema. The property names must match Better Auth's field
 * names exactly (camelCase) — the Drizzle adapter looks them up by key. The
 * underlying column names are snake_case; Drizzle maps between the two.
 *
 * `id` is text rather than uuid because Better Auth generates string ids;
 * word_bank.user_id references it as text.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Saved vocabulary, one row per saved word. /api/word-bank maps rows to the
 * client-side `WordBankEntry` type.
 *
 * There is no RLS here — Neon has no public REST surface, and every query in
 * /api/word-bank is scoped by the session's user id. That scoping is the only
 * thing preventing cross-user reads; keep it that way.
 */
export const wordBank = pgTable(
  "word_bank",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    translation: text("translation").notNull(),
    contextMessage: text("context_message").notNull(),
    contextRole: text("context_role").notNull(),
    scenarioId: text("scenario_id").notNull(),
    scenarioTitle: text("scenario_title").notNull(),
    language: text("language").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("word_bank_user_created_idx").on(t.userId, t.createdAt)]
);

/**
 * Durable diagnostic log — see docs/diagnostics.md.
 *
 * userId is deliberately unconstrained (no FK): diagnostics should survive the
 * user row being deleted, and client-reported events may have no user at all.
 */
export const debugEvents = pgTable(
  "debug_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    level: text("level").notNull(),
    event: text("event").notNull(),
    source: text("source").notNull().default("server"),
    route: text("route"),
    environment: text("environment"),
    userId: text("user_id"),
    detail: jsonb("detail").notNull().default({}),
  },
  (t) => [
    index("debug_events_created_at_idx").on(t.createdAt),
    index("debug_events_event_idx").on(t.event, t.createdAt),
  ]
);
