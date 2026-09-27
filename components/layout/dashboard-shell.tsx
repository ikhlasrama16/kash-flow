"use client";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { navigation } from "./navigation";
import { useAuth } from "@/components/providers/auth-provider";
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { logout } = useAuth();
  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <Sidebar />
      <div className="app-body">
        <Topbar onToggleMobileNav={() => drawer.current?.showModal()} />
        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
      <MobileNav />
      <dialog
        ref={drawer}
        className="navigation-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
      >
        <div className="navigation-dialog-header">
          <strong>Semua menu</strong>
          <button
            type="button"
            className="icon-button"
            onClick={() => drawer.current?.close()}
            aria-label="Tutup menu"
          >
            <X />
          </button>
        </div>
        <nav className="sidebar-links" aria-label="Semua halaman">
          {navigation.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => drawer.current?.close()}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              {name}
            </Link>
          ))}
        </nav>
        <button
          className="text-action"
          type="button"
          onClick={() => {
            drawer.current?.close();
            void logout();
          }}
        >
          <LogOut size={18} />
          Keluar dari akun
        </button>
      </dialog>
    </div>
  );
}
