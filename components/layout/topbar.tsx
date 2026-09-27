"use client";
import Link from "next/link";
import { Sun, Moon, Bell, Menu, ChartNoAxesColumn } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
export function Topbar({
  onToggleMobileNav,
}: {
  onToggleMobileNav?: () => void;
  mobileNavOpen?: boolean;
}) {
  const { toggleTheme, actualTheme } = useTheme();
  return (
    <header className="app-topbar">
      <div className="mobile-brand">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleMobileNav}
          aria-label="Buka semua menu"
        >
          <Menu size={21} />
        </button>
        <Link href="/dashboard">
          <ChartNoAxesColumn size={23} />
          KashFlow
        </Link>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={
            actualTheme === "dark"
              ? "Gunakan tema terang"
              : "Gunakan tema gelap"
          }
        >
          {actualTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link
          href="/notifications"
          className="icon-button"
          aria-label="Notifikasi"
        >
          <Bell size={21} />
        </Link>
      </div>
    </header>
  );
}
