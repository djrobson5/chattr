"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // In dev, chunk URLs under /_next/static/ can stay the same across edits,
    // so the worker's cache-first strategy would keep serving stale code.
    // Only run it in production, and clear out any worker a dev session left.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {});
      caches
        ?.keys()
        .then((keys) =>
          keys
            .filter((key) => key.startsWith("texting-sim-"))
            .forEach((key) => caches.delete(key))
        )
        .catch(() => {});
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failed — no action needed
    });
  }, []);

  return null;
}
