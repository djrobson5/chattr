"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth client. baseURL is left unset so it resolves against the
 * current origin, which keeps previews, localhost and production all working
 * without per-environment configuration.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
