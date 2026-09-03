"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0c111d]/90 backdrop-blur-md h-screen sticky top-0 z-30 justify-between p-4 select-none">
      <div>
        {/* Brand Logo & Name */}
        <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-4 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white tracking-tight text-base flex items-center gap-1.5">
              Kash<span className="text-emerald-500 font-extrabold">Flow</span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              Personal Wealth Monitor
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section: Settings & Logout */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
          )}
        >
          <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>Settings</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
