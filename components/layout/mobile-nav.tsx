"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "./navigation";
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-dock" aria-label="Navigasi bawah">
      {navigation
        .filter((item) =>
          ["/dashboard", "/transactions", "/accounts", "/analytics"].includes(
            item.href,
          ),
        )
        .map(({ name, href, icon: Icon }) => (
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
  );
}
