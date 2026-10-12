"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import PhoneFrame from "@/components/PhoneFrame";
import Link from "next/link";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { settings } = useSettings();
  const dark = settings.darkMode;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Better Auth signs the new user in on success (autoSignIn defaults on).
    const { error } = await authClient.signUp.email({ name, email, password });

    if (error) {
      setError(error.message ?? "Sign up failed. Please try again.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <PhoneFrame>
      <div className={`flex-1 overflow-y-auto px-6 py-8 ${dark ? "text-gray-100" : "text-gray-800"}`}>
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              Name
            </label>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                dark
                  ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                dark
                  ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${dark ? "text-gray-300" : "text-gray-700"}`}>
              Password
            </label>
            {/* No minLength here: the server's "Password too short" error is
                shown in the error box above, like every other sign-up error. */}
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                dark
                  ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className={`mt-3 text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
          <Link href="/" className="hover:underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </PhoneFrame>
  );
}
