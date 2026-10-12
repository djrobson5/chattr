import { connection } from "next/server";
import { isSignupAllowed } from "@/lib/signup";
import InviteOnlyNotice from "./InviteOnlyNotice";
import SignupForm from "./SignupForm";

/**
 * Server component so ALLOW_SIGNUP is read on each request rather than baked
 * into the build. connection() opts the route into dynamic rendering, which
 * means flipping the variable only needs a server restart (or, on Vercel, a
 * redeploy), not a rebuild. The API enforces the same rule in lib/auth.ts.
 */
export default async function SignupPage() {
  await connection();
  return isSignupAllowed() ? <SignupForm /> : <InviteOnlyNotice />;
}
