import { connection } from "next/server";
import { isSignupAllowed } from "@/lib/signup";
import LoginForm from "./LoginForm";

/**
 * Server component for the same reason as the signup page: ALLOW_SIGNUP is
 * read per request, so the "Sign up" link and the invitation-only note follow
 * the variable without a rebuild.
 */
export default async function LoginPage() {
  await connection();
  return <LoginForm signupAllowed={isSignupAllowed()} />;
}
