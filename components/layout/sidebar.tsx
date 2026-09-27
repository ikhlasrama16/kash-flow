"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChartNoAxesColumn } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { navigation } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const name = user?.email?.split("@")[0] || "Akun saya";
  return (
    <aside className="app-sidebar">
      <Link href="/dashboard" className="app-brand">
        <ChartNoAxesColumn aria-hidden="true" />
        <span>
          KashFlow<small>KEUANGAN PRIBADI</small>
        </span>
      </Link>
      <nav aria-label="Navigasi utama" className="sidebar-links">
        {navigation.map(({ name, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{name}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-account">
        <Link href="/settings">
          <span className="user-avatar">{name.slice(0, 2).toUpperCase()}</span>
          <span className="truncate">{name}</span>
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Keluar dari akun"
          title="Keluar"
        >
          <LogOut size={19} />
        </button>
      </div>
    </aside>
  );
}
