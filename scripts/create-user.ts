/**
 * Provision a new email/password account. Sign-up is disabled at the API
 * (invite-only), so this is the only way to add a user.
 *
 *   npx tsx --env-file=.env.local scripts/create-user.ts <email> "<name>" [password]
 *
 * If no password is given, a random one is generated. The password is printed
 * once — send it to the user out of band. Uses Better Auth's own hasher so the
 * stored hash matches what sign-in expects.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { user, account } from "../src/lib/db/schema";
import { auth } from "../src/lib/auth";

async function main() {
  const [rawEmail, name, given] = process.argv.slice(2);
  if (!rawEmail || !name) {
    console.error('usage: create-user.ts <email> "<name>" [password]');
    process.exit(1);
  }

  // Better Auth lowercases the email on sign-in, so store it the same way.
  const email = rawEmail.trim().toLowerCase();

  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) {
    console.error(`user ${email} already exists — use reset-password.ts instead`);
    process.exit(1);
  }

  const password = given ?? randomBytes(12).toString("hex");
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const id = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      email,
      name,
      // No email provider is configured, so verification can't happen; the
      // account was issued by an admin, which is verification enough.
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    // Better Auth stores email/password credentials as an account row with
    // providerId "credential".
    await tx.insert(account).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: hash,
      createdAt: now,
      updatedAt: now,
    });
  });

  console.log(`✓ created user ${email} (${name})`);
  console.log(`\n=== PASSWORD — shown once ===\n${password}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
