import { Transaction } from "@/types/transaction";
import { ReportSummary, ReportComparison } from "@/types/report";

export type TimePeriod =
  | "today"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "all_time"
  | `month_${string}`; // e.g. month_2026-08

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function getDateRangeForPeriod(period: string, referenceDate: Date = new Date()): DateRange {
  const now = new Date(referenceDate);

  if (period === "today" || period === "daily") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end, label: "Hari Ini" };
  }

  if (period === "this_week" || period === "weekly") {
    // Current week starting Monday
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Minggu Ini" };
  }

  if (period === "last_week") {
    // Previous week
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day - 7;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Minggu Lalu" };
  }

  if (period === "this_month" || period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`,
    };
  }

  if (period === "last_month") {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Bulan Lalu (${MONTH_NAMES_ID[start.getMonth()]} ${start.getFullYear()})`,
    };
  }

  if (period.startsWith("month_")) {
    const parts = period.replace("month_", "").split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const start = new Date(year, monthIdx, 1, 0, 0, 0, 0);
      const end = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
      return {
        start,
        end,
        label: `${MONTH_NAMES_ID[monthIdx]} ${year}`,
      };
    }
  }

  // "all_time" or default
  return {
    start: new Date(2020, 0, 1),
    end: new Date(2099, 11, 31, 23, 59, 59, 999),
    label: "Semua Waktu",
  };
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: string
): Transaction[] {
  if (period === "all_time") return transactions;

  const { start, end } = getDateRangeForPeriod(period);
  const startTime = start.getTime();
  const endTime = end.getTime();

  return transactions.filter((tx) => {
    const txTime = new Date(tx.occurred_at).getTime();
    return txTime >= startTime && txTime <= endTime;
  });
}

export interface AvailableMonth {
  value: string;
  label: string;
  count: number;
}

export function getAvailableMonths(transactions: Transaction[]): AvailableMonth[] {
  const monthMap = new Map<string, { label: string; count: number; date: Date }>();

  for (const tx of transactions) {
    if (!tx.occurred_at) continue;
    const d = new Date(tx.occurred_at);
    if (isNaN(d.getTime())) continue;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = `month_${y}-${m}`;
    const label = `${MONTH_NAMES_ID[d.getMonth()]} ${y}`;

    const existing = monthMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      monthMap.set(key, { label, count: 1, date: new Date(y, d.getMonth(), 1) });
    }
  }

  // Sort descending by date
  return Array.from(monthMap.entries())
    .sort((a, b) => b[1].date.getTime() - a[1].date.getTime())
    .map(([value, item]) => ({
      value,
      label: item.label,
      count: item.count,
    }));
}

export interface ChartDataPoint {
  key: string;
  label: string;
  Pemasukan: number;
  Pengeluaran: number;
  Net: number;
  Cumulative: number;
  txCount: number;
}

export function buildTimeSeriesChartData(
  transactions: Transaction[],
  period: string
): ChartDataPoint[] {
  if (transactions.length === 0) return [];

  const { start, end } = getDateRangeForPeriod(period);
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );

  // Grouping strategy based on period
  if (period === "today" || period === "daily") {
    // Group by 4-hour slots
    const slots = [
      { label: "00:00", hStart: 0, hEnd: 4 },
      { label: "04:00", hStart: 4, hEnd: 8 },
      { label: "08:00", hStart: 8, hEnd: 12 },
      { label: "12:00", hStart: 12, hEnd: 16 },
      { label: "16:00", hStart: 16, hEnd: 20 },
      { label: "20:00", hStart: 20, hEnd: 24 },
    ];

    let cum = 0;
    return slots.map((slot) => {
      let inc = 0;
      let exp = 0;
      let cnt = 0;
      for (const tx of sorted) {
        const d = new Date(tx.occurred_at);
        const h = d.getHours();
        if (h >= slot.hStart && h < slot.hEnd) {
          cnt++;
          if (tx.type === "income") inc += Number(tx.amount) || 0;
          if (tx.type === "expense") exp += Number(tx.amount) || 0;
        }
      }
      const net = inc - exp;
      cum += net;
      return {
        key: slot.label,
        label: slot.label,
        Pemasukan: inc,
        Pengeluaran: exp,
        Net: net,
        Cumulative: cum,
        txCount: cnt,
      };
    });
  }

  if (period === "this_week" || period === "last_week" || period === "weekly") {
    // Group by 7 days (Monday to Sunday)
    const result: ChartDataPoint[] = [];
    let cum = 0;
    const current = new Date(start);

    for (let i = 0; i < 7; i++) {
      const dStart = new Date(current);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(current);
      dEnd.setHours(23, 59, 59, 999);

      const dayTransactions = sorted.filter((tx) => {
        const t = new Date(tx.occurred_at).getTime();
        return t >= dStart.getTime() && t <= dEnd.getTime();
      });

      let inc = 0;
      let exp = 0;
      for (const tx of dayTransactions) {
        if (tx.type === "income") inc += Number(tx.amount) || 0;
        if (tx.type === "expense") exp += Number(tx.amount) || 0;
      }
      const net = inc - exp;
      cum += net;

      const dayName = DAY_NAMES_ID[current.getDay()];
      const dateNum = current.getDate();

      result.push({
        key: `${dayName} ${dateNum}`,
        label: `${dayName} ${dateNum}`,
        Pemasukan: inc,
        Pengeluaran: exp,
        Net: net,
        Cumulative: cum,
        txCount: dayTransactions.length,
      });

      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  // Monthly / Specific Month / All time: Group by active days or every day of the month
  if (period.includes("month")) {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const result: ChartDataPoint[] = [];
    let cum = 0;

    // Group by day map
    const dayMap = new Map<number, { inc: number; exp: number; cnt: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap.set(d, { inc: 0, exp: 0, cnt: 0 });
    }

    for (const tx of sorted) {
      const d = new Date(tx.occurred_at);
      if (d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth()) {
        const dayNum = d.getDate();
        const existing = dayMap.get(dayNum);
        if (existing) {
          existing.cnt++;
          if (tx.type === "income") existing.inc += Number(tx.amount) || 0;
          if (tx.type === "expense") existing.exp += Number(tx.amount) || 0;
        }
      }
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const item = dayMap.get(d) || { inc: 0, exp: 0, cnt: 0 };
      const net = item.inc - item.exp;
      cum += net;

      result.push({
        key: `Tgl ${d}`,
        label: `Tgl ${d}`,
        Pemasukan: item.inc,
        Pengeluaran: item.exp,
        Net: net,
        Cumulative: cum,
        txCount: item.cnt,
      });
    }

    return result;
  }

  // All time: Group by distinct transaction dates or months
  const dateMap = new Map<string, { label: string; inc: number; exp: number; cnt: number }>();
  for (const tx of sorted) {
    const d = new Date(tx.occurred_at);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    const existing = dateMap.get(key);
    const inc = tx.type === "income" ? Number(tx.amount) || 0 : 0;
    const exp = tx.type === "expense" ? Number(tx.amount) || 0 : 0;

    if (existing) {
      existing.inc += inc;
      existing.exp += exp;
      existing.cnt += 1;
    } else {
      dateMap.set(key, { label: key, inc, exp, cnt: 1 });
    }
  }

  let cum = 0;
  return Array.from(dateMap.entries()).map(([key, val]) => {
    const net = val.inc - val.exp;
    cum += net;
    return {
      key,
      label: val.label,
      Pemasukan: val.inc,
      Pengeluaran: val.exp,
      Net: net,
      Cumulative: cum,
      txCount: val.cnt,
    };
  });
}

export function computeSummaryMetrics(
  filteredTransactions: Transaction[],
  allTransactions: Transaction[],
  period: string
): { summary: ReportSummary; comparison?: ReportComparison } {
  let income = 0;
  let expense = 0;
  let expenseCount = 0;
  let transferCount = 0;

  for (const tx of filteredTransactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") income += amt;
    else if (tx.type === "expense") {
      expense += amt;
      expenseCount++;
    } else if (tx.type === "transfer") {
      transferCount++;
    }
  }

  const { start, end } = getDateRangeForPeriod(period);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const average_daily_expense = Math.round(expense / diffDays);

  // Compute previous period comparison
  let previous_period_expense = 0;
  if (period === "this_month" || period === "monthly") {
    const prevRange = getDateRangeForPeriod("last_month");
    const prevTxs = allTransactions.filter((tx) => {
      const t = new Date(tx.occurred_at).getTime();
      return t >= prevRange.start.getTime() && t <= prevRange.end.getTime() && tx.type === "expense";
    });
    previous_period_expense = prevTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  } else if (period === "this_week" || period === "weekly") {
    const prevRange = getDateRangeForPeriod("last_week");
    const prevTxs = allTransactions.filter((tx) => {
      const t = new Date(tx.occurred_at).getTime();
      return t >= prevRange.start.getTime() && t <= prevRange.end.getTime() && tx.type === "expense";
    });
    previous_period_expense = prevTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }

  let comparison: ReportComparison | undefined;
  if (previous_period_expense > 0) {
    const expense_change_amount = expense - previous_period_expense;
    const expense_change_percentage = (expense_change_amount / previous_period_expense) * 100;
    comparison = {
      previous_period_expense,
      expense_change_amount,
      expense_change_percentage,
    };
  }

  return {
    summary: {
      income,
      expense,
      net_cashflow: income - expense,
      transaction_count: filteredTransactions.length,
      expense_transaction_count: expenseCount,
      transfer_count: transferCount,
      average_daily_expense,
      reconciliation_adjustment: 0,
    },
    comparison,
  };
}
