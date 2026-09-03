import { describe, it, expect } from "vitest";
import { formatIDR, formatDate, formatDateTime, formatRelativeTime } from "../lib/utils";

describe("Financial Utility Functions", () => {
  it("formats positive IDR amounts correctly without decimals", () => {
    const formatted = formatIDR(5000000);
    // id-ID format: Rp 5.000.000
    expect(formatted).toMatch(/Rp.*5\.000\.000/);
  });

  it("formats negative IDR amounts with leading negative sign", () => {
    const formatted = formatIDR(-85000);
    expect(formatted).toMatch(/-Rp.*85\.000/);
  });

  it("handles string numeric amounts gracefully", () => {
    const formatted = formatIDR("100000");
    expect(formatted).toMatch(/Rp.*100\.000/);
  });

  it("supports showSign option for positive values", () => {
    const formatted = formatIDR(25000, { showSign: true });
    expect(formatted).toMatch(/\+Rp.*25\.000/);
  });

  it("formats ISO dates correctly", () => {
    const dateStr = "2026-09-03T10:00:00Z";
    const formatted = formatDate(dateStr);
    expect(formatted).toContain("2026");

    const dateTime = formatDateTime(dateStr);
    expect(dateTime).toContain("2026");
  });

  it("handles relative time for recent timestamps", () => {
    const now = new Date();
    const result = formatRelativeTime(now.toISOString());
    expect(result).toBe("Baru saja");
  });
});
