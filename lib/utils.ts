import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a monetary amount in Indonesian Rupiah (IDR).
 * Example: 5000000 -> "Rp 5.000.000"
 * Example: -85000 -> "-Rp 85.000"
 */
export function formatIDR(amount: number | bigint | string, options?: { showSign?: boolean }): string {
  const numeric = typeof amount === "string" ? parseInt(amount, 10) || 0 : Number(amount);
  const isNegative = numeric < 0;
  const absValue = Math.abs(numeric);

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(absValue)
    .replace(/\s+/g, " ");

  if (isNegative) {
    return `-${formatted}`;
  }

  if (options?.showSign && numeric > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Format a standard ISO date string to Indonesian localized display.
 * Example: "2026-09-03T15:30:00Z" -> "03 Sep 2026, 22:30"
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format date only: "03 Sep 2026"
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Relative time formatter (e.g. "5 mnt lalu", "2 jam lalu", "Kemarin")
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Baru saja";
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay === 1) return "Kemarin";
    if (diffDay < 7) return `${diffDay} hr lalu`;
    return formatDate(date);
  } catch {
    return "-";
  }
}
