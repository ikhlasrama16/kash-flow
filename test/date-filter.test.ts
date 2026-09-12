import { describe, expect, it } from "vitest";
import {
  computeSummaryMetrics,
  isDateInDateRange,
  getPresetDates,
  formatIDDate,
} from "../lib/utils/date-filter";
import { Transaction } from "../types/transaction";

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 1,
  type: "expense",
  amount: 0,
  source: "notification",
  parse_status: "AUTO",
  occurred_at: "2026-09-04T10:00:00Z",
  created_at: "2026-09-04T10:00:00Z",
  updated_at: "2026-09-04T10:00:00Z",
  ...overrides,
});

describe("computeSummaryMetrics", () => {
  it("excludes balance reconciliation entries from cashflow", () => {
    const transactions = [
      transaction({ id: 1, type: "income", amount: 20_000 }),
      transaction({ id: 2, type: "expense", amount: 15_000 }),
      transaction({ id: 3, type: "income", amount: 3_025_255, source: "reconcile" }),
      transaction({ id: 4, type: "expense", amount: 30_648, source: "reconcile" }),
    ];

    const { summary } = computeSummaryMetrics(transactions, transactions, "this_month");

    expect(summary.income).toBe(20_000);
    expect(summary.expense).toBe(15_000);
    expect(summary.net_cashflow).toBe(5_000);
    expect(summary.transaction_count).toBe(2);
  });
});

describe("isDateInDateRange", () => {
  it("returns true when no start or end date is provided", () => {
    expect(isDateInDateRange("2026-09-04T10:00:00Z")).toBe(true);
    expect(isDateInDateRange(new Date("2026-09-04T10:00:00Z"), "", "")).toBe(true);
  });

  it("returns true when date is within range", () => {
    expect(isDateInDateRange("2026-09-05T12:00:00Z", "2026-09-01", "2026-09-10")).toBe(true);
    expect(isDateInDateRange("2026-09-01T00:00:00Z", "2026-09-01", "2026-09-10")).toBe(true);
    expect(isDateInDateRange("2026-09-10T12:00:00Z", "2026-09-01", "2026-09-10")).toBe(true);
  });

  it("returns false when date is before start date or after end date", () => {
    // 2026-08-31T16:00:00Z is 23:00 WIB (Aug 31 in Jakarta)
    expect(isDateInDateRange("2026-08-31T16:00:00Z", "2026-09-01", "2026-09-10")).toBe(false);
    expect(isDateInDateRange("2026-09-15T00:00:00Z", "2026-09-01", "2026-09-10")).toBe(false);
  });

  it("respects Asia/Jakarta (UTC+7) timezone conversion", () => {
    // 2026-08-31T23:59:59Z is 06:59:59 WIB on 2026-09-01 in Jakarta
    expect(isDateInDateRange("2026-08-31T23:59:59Z", "2026-09-01", "2026-09-10")).toBe(true);
  });

  it("handles only startDate or only endDate filters", () => {
    expect(isDateInDateRange("2026-09-05T00:00:00Z", "2026-09-01", "")).toBe(true);
    expect(isDateInDateRange("2026-08-30T00:00:00Z", "2026-09-01", "")).toBe(false);
    expect(isDateInDateRange("2026-09-05T00:00:00Z", "", "2026-09-10")).toBe(true);
    expect(isDateInDateRange("2026-09-15T00:00:00Z", "", "2026-09-10")).toBe(false);
  });

  it("returns false for invalid or null dates", () => {
    expect(isDateInDateRange(null, "2026-09-01", "2026-09-10")).toBe(false);
    expect(isDateInDateRange("invalid-date", "2026-09-01", "2026-09-10")).toBe(false);
  });
});

describe("getPresetDates and date formatting", () => {
  it("returns empty range for 'all' preset", () => {
    const dates = getPresetDates("all");
    expect(dates.startDate).toBe("");
    expect(dates.endDate).toBe("");
  });

  it("returns non-empty startDate and endDate for 'today' and 'this_month'", () => {
    const today = getPresetDates("today");
    expect(today.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today.startDate).toBe(today.endDate);

    const month = getPresetDates("this_month");
    expect(month.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(month.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats Indonesian date string properly", () => {
    expect(formatIDDate("2026-09-12")).toContain("Sep");
    expect(formatIDDate("2026-09-12")).toContain("2026");
    expect(formatIDDate("")).toBe("-");
  });
});
