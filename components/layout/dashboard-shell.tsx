"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  BarChart3,
  Bell,
  Settings,
  TrendingUp,
} from "lucide-react";
import { AnimatedBackground } from "@/components/react-bits/animated-background";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0c111d] border-r border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="font-bold text-base tracking-tight">
              Kash<span className="text-emerald-500">Flow</span>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-500 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500">
          KashFlow v1.0 • Personal Monitor
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8 relative">
        <Topbar
          onToggleMobileNav={() => setMobileDrawerOpen((prev) => !prev)}
          mobileNavOpen={mobileDrawerOpen}
        />
        <AnimatedBackground>
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto relative z-10">{children}</main>
        </AnimatedBackground>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
