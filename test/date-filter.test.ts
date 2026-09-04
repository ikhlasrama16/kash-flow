import { describe, expect, it } from "vitest";
import { computeSummaryMetrics } from "../lib/utils/date-filter";
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
