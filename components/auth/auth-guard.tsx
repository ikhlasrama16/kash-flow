"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { TrendingUp, Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Prevent flash of protected dashboard content during initial verification
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-white selection:bg-emerald-500/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-pulse">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Memverifikasi sesi...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, render loading/null while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#090d16]" />
    );
  }

  // Fully verified and authenticated
  return <>{children}</>;
}
