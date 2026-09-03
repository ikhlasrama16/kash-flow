"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Bell, Activity, Menu, X, TrendingUp } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { checkLiveness } from "@/lib/api/health";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/accounts": "Accounts & Wallets",
  "/categories": "Categories",
  "/analytics": "Financial Analytics",
  "/notifications": "Raw Ingestion Logs",
  "/settings": "System Settings",
};

export function Topbar({ onToggleMobileNav, mobileNavOpen }: { onToggleMobileNav?: () => void; mobileNavOpen?: boolean }) {
  const pathname = usePathname();
  const { toggleTheme, actualTheme } = useTheme();

  const [backendOk, setBackendOk] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;
    const ping = () => {
      checkLiveness()
        .then(() => {
          if (active) setBackendOk(true);
        })
        .catch(() => {
          if (active) setBackendOk(false);
        });
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const pageTitle = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname === route || (route !== "/dashboard" && pathname.startsWith(route))
  )?.[1] || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090d16]/80 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile toggle */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Brand */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">
            Kash<span className="text-emerald-500">Flow</span>
          </span>
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend live indicator */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 text-slate-600 dark:text-slate-400"
          title={backendOk === true ? "Go API Connected" : backendOk === false ? "Go API Disconnected" : "Checking Go API..."}
        >
          <Activity className="w-3 h-3 text-slate-400" />
          <span
            className={`w-2 h-2 rounded-full ${
              backendOk === true
                ? "bg-emerald-500 animate-pulse"
                : backendOk === false
                ? "bg-rose-500"
                : "bg-amber-400"
            }`}
          />
          <span className="hidden md:inline">
            {backendOk === true ? "API Live" : backendOk === false ? "API Offline" : "Connecting..."}
          </span>
        </div>

        {/* Notification quick link */}
        <Link
          href="/notifications"
          className="relative rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </Link>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Toggle theme"
          title={actualTheme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
        >
          {actualTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
