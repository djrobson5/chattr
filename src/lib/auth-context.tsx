"use client";

import { createContext, useContext, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * The subset of the session user the UI actually reads, decoupled from Better
 * Auth's own user type so components do not depend on the auth library.
 */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();

  const user: AppUser | null = data?.user
    ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
      }
    : null;

  async function signOut() {
    await authClient.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
