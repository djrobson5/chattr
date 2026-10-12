import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { AppUser } from "@/lib/auth-context";

type AuthResult = { user: AppUser } | NextResponse;

/**
 * Every API route calls this the same way: it returns either the signed-in
 * user or a ready-made 401/500 response to return as-is.
 */
export async function requireAuth(): Promise<AuthResult> {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("[auth-guard] session lookup failed:", error);
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  };
}
