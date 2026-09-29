"use client";
import { useRef, useEffect, useCallback } from "react";
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
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const { logout } = useAuth();
  const openDrawer = useCallback(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    dialog.classList.remove("is-closing");
    if (!dialog.open) dialog.showModal();
  }, []);
  const closeDrawer = useCallback(() => {
    const dialog = drawer.current;
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }
    dialog.classList.add("is-closing");
    closeTimer.current = window.setTimeout(() => {
      dialog.close();
      dialog.classList.remove("is-closing");
      closeTimer.current = null;
    }, 200);
  }, []);
  useEffect(() => {
    closeDrawer();
  }, [closeDrawer, pathname]);
  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <Sidebar />
      <div className="app-body">
        <Topbar onToggleMobileNav={openDrawer} />
        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
      <MobileNav />
      <dialog
        ref={drawer}
        className="navigation-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeDrawer();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDrawer();
        }}
      >
        <div className="navigation-dialog-header">
          <strong>Semua menu</strong>
          <button
            type="button"
            className="icon-button"
            onClick={closeDrawer}
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
              onClick={closeDrawer}
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
            closeDrawer();
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
