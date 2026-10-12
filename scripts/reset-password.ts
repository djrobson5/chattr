/**
 * Set a new password for an existing email/password account.
 *
 *   npx tsx --env-file=.env.local scripts/reset-password.ts <email> [password]
 *
 * If no password is given, a random one is generated. The password is printed
 * once. Existing sessions for the user are revoked so stale cookies stop working.
 * Uses Better Auth's own hasher so the stored hash matches what sign-in expects.
 */
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { user, account, session } from "../src/lib/db/schema";
import { auth } from "../src/lib/auth";

async function main() {
  const [rawEmail, given] = process.argv.slice(2);
  if (!rawEmail) {
    console.error("usage: reset-password.ts <email> [password]");
    process.exit(1);
  }
  const email = rawEmail.trim().toLowerCase();

  const [u] = await db.select().from(user).where(eq(user.email, email));
  if (!u) {
    console.error(`no user with email ${email}`);
    process.exit(1);
  }

  const password = given ?? randomBytes(12).toString("hex");
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const updated = await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(and(eq(account.userId, u.id), eq(account.providerId, "credential")))
    .returning({ id: account.id });

  if (updated.length === 0) {
    console.error(`user ${email} has no credential account row`);
    process.exit(1);
  }

  const revoked = await db.delete(session).where(eq(session.userId, u.id)).returning({ id: session.id });

  console.log(`✓ password updated for ${email} (${revoked.length} session(s) revoked)`);
  console.log(`\n=== NEW PASSWORD — shown once ===\n${password}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
