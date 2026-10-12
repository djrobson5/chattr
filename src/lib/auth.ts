import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * BETTER_AUTH_URL is set for production only. Preview deployments fall through
 * to VERCEL_URL, which is that specific deployment's own hostname — falling
 * back to VERCEL_PROJECT_PRODUCTION_URL here would point every preview's auth
 * callbacks at production.
 */
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

/**
 * Origins allowed to call the auth endpoints, derived from config:
 * - BETTER_AUTH_URL (the canonical production origin, if set)
 * - VERCEL_URL (this deployment's own hostname, which covers previews)
 * - TRUSTED_ORIGINS, an optional comma-separated list (e.g. custom domains)
 * - localhost for local dev
 */
const trustedOrigins = [
  ...new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      ...(process.env.TRUSTED_ORIGINS ?? "").split(","),
      "http://localhost:3000",
      "http://localhost:3001",
    ]
      .map((origin) => origin?.trim())
      .filter((origin): origin is string => Boolean(origin))
  ),
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Access is invite-only (accounts are created with scripts/create-user.ts).
    // The signup page is a static notice; this enforces the same rule at the
    // API, so the endpoint cannot be used to self-register.
    disableSignUp: true,
  },

  session: {
    // Cache the session in a signed cookie so a page load does not hit the
    // database every time. On Neon this is not just latency — each query wakes
    // the compute and bills against the monthly CU-hour allowance. The cost is
    // that a revoked session can stay live for up to maxAge.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins,
});
