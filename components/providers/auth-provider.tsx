"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LoginRequest, AuthContextType } from "@/types/auth";
import { getCurrentUser, loginUser, logoutUser } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setIsLoading(false);
    if (pathname !== "/login") {
      startTransition(() => {
        router.push("/login");
      });
    }
  }, [pathname, router]);

  const checkSession = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      return currentUser;
    } catch {
      setUser(null);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Register unauthorized interceptor & perform initial session check on mount
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    checkSession();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [checkSession, handleUnauthorized]);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedUser = await loginUser(credentials);
      setUser(loggedUser);
      setIsLoading(false);
      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
      return loggedUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [router]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setIsLoading(false);
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
