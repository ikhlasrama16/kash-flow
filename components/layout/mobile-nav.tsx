"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_TABS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { name: "Akun", href: "/accounts", icon: Wallet },
  { name: "Analitik", href: "/analytics", icon: BarChart3 },
  { name: "Logs", href: "/notifications", icon: Bell },
  { name: "Setelan", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md px-2 py-1.5 shadow-lg safe-area-inset-bottom">
      <nav className="flex items-center justify-around">
        {MOBILE_TABS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 min-w-[52px]",
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110 text-emerald-500")} />
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
