/**
 * Whether self-registration is open. Only the exact value "true" enables it;
 * unset, "false", "TRUE", typos and everything else keep sign-up disabled.
 *
 * Invite-only is the deliberate default: every chat turn is billed to the
 * deployment's Gemini key, so a copy deployed without thinking about this
 * should not be open to anyone who finds the URL.
 *
 * Server-only. Read it at request time (or module load on the server), never
 * through a NEXT_PUBLIC_ variable, so it can be changed without a rebuild.
 */
export function isSignupAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ALLOW_SIGNUP === "true";
}
