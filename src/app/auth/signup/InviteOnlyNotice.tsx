"use client";

import { useSettings } from "@/lib/settings-context";
import PhoneFrame from "@/components/PhoneFrame";
import Link from "next/link";

export default function InviteOnlyNotice() {
  const { settings } = useSettings();
  const dark = settings.darkMode;

  return (
    <PhoneFrame>
      <div className={`flex-1 flex items-center justify-center px-6 ${dark ? "text-gray-100" : "text-gray-800"}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Invite Only</h2>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Registration is invite-only. Contact your instructor or the site administrator for access.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 text-blue-500 hover:underline text-sm font-medium"
          >
            Back to Sign In
          </Link>
          <p className={`mt-3 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            <Link href="/" className="hover:underline">
              Continue as guest
            </Link>
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
