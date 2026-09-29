"use client";

import React, { useState, useMemo } from "react";
import { Transaction } from "@/types/transaction";
import { formatIDR } from "@/lib/utils";
import { getDateRangeForPeriod } from "@/lib/utils/date-filter";

interface AppleTrendChartProps {
  transactions: Transaction[];
  period: string;
}

export interface TrendBucket {
  key: string;
  shortLabel: string;
  fullLabel: string;
  income: number;
  expense: number;
  txCount: number;
}

export function buildTrendBuckets(
  transactions: Transaction[],
  period: string,
  granularity: "weekly" | "daily"
): TrendBucket[] {
  const { start, end } = getDateRangeForPeriod(period);
  const isMonth = period.includes("month");
  const isWeek = period === "this_week" || period === "last_week" || period === "weekly";
  const isToday = period === "today";

  // Filter out reconciliations and transactions outside range
  const validTx = transactions.filter((tx) => {
    if (tx.source === "reconcile") return false;
    const t = new Date(tx.occurred_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });

  if (isToday) {
    const slots = [
      { label: "00:00", full: "Pukul 00:00 – 04:00", h1: 0, h2: 4 },
      { label: "04:00", full: "Pukul 04:00 – 08:00", h1: 4, h2: 8 },
      { label: "08:00", full: "Pukul 08:00 – 12:00", h1: 8, h2: 12 },
      { label: "12:00", full: "Pukul 12:00 – 16:00", h1: 12, h2: 16 },
      { label: "16:00", full: "Pukul 16:00 – 20:00", h1: 16, h2: 20 },
      { label: "20:00", full: "Pukul 20:00 – 24:00", h1: 20, h2: 24 },
    ];
    return slots.map((s) => {
      let inc = 0;
      let exp = 0;
      let count = 0;
      for (const tx of validTx) {
        const h = new Date(tx.occurred_at).getHours();
        if (h >= s.h1 && h < s.h2) {
          count++;
          if (tx.type === "income") inc += Number(tx.amount) || 0;
          if (tx.type === "expense") exp += Number(tx.amount) || 0;
        }
      }
      return {
        key: s.label,
        shortLabel: s.label,
        fullLabel: s.full,
        income: inc,
        expense: exp,
        txCount: count,
      };
    });
  }

  if (isWeek) {
    const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const DAY_NAMES_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const buckets: TrendBucket[] = [];
    const cur = new Date(start);

    for (let i = 0; i < 7; i++) {
      const dStart = new Date(cur);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(cur);
      dEnd.setHours(23, 59, 59, 999);

      let inc = 0;
      let exp = 0;
      let count = 0;

      for (const tx of validTx) {
        const t = new Date(tx.occurred_at).getTime();
        if (t >= dStart.getTime() && t <= dEnd.getTime()) {
          count++;
          if (tx.type === "income") inc += Number(tx.amount) || 0;
          if (tx.type === "expense") exp += Number(tx.amount) || 0;
        }
      }

      const dayIdx = cur.getDay();
      buckets.push({
        key: `${cur.getDate()}-${cur.getMonth()}`,
        shortLabel: DAY_NAMES[dayIdx],
        fullLabel: `${DAY_NAMES_FULL[dayIdx]}, ${cur.getDate()} ${cur.toLocaleDateString("id-ID", { month: "short" })}`,
        income: inc,
        expense: exp,
        txCount: count,
      });

      cur.setDate(cur.getDate() + 1);
    }
    return buckets;
  }

  // Monthly
  if (isMonth) {
    if (granularity === "weekly") {
      // 5 weekly buckets (M1..M5)
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const monthShort = start.toLocaleDateString("id-ID", { month: "short" });
      const weekRanges = [
        { start: 1, end: 7, label: "M1", full: `1–7 ${monthShort}` },
        { start: 8, end: 14, label: "M2", full: `8–14 ${monthShort}` },
        { start: 15, end: 21, label: "M3", full: `15–21 ${monthShort}` },
        { start: 22, end: 28, label: "M4", full: `22–28 ${monthShort}` },
        { start: 29, end: daysInMonth, label: "M5", full: `29–${daysInMonth} ${monthShort}` },
      ];

      return weekRanges.map((w) => {
        let inc = 0;
        let exp = 0;
        let count = 0;

        for (const tx of validTx) {
          const d = new Date(tx.occurred_at);
          if (d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth()) {
            const dateNum = d.getDate();
            if (dateNum >= w.start && dateNum <= w.end) {
              count++;
              if (tx.type === "income") inc += Number(tx.amount) || 0;
              if (tx.type === "expense") exp += Number(tx.amount) || 0;
            }
          }
        }

        return {
          key: w.label,
          shortLabel: w.label,
          fullLabel: `Minggu ${w.label.slice(1)} (${w.full})`,
          income: inc,
          expense: exp,
          txCount: count,
        };
      });
    }

    // Daily breakdown
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const buckets: TrendBucket[] = [];
    const monthShort = start.toLocaleDateString("id-ID", { month: "short" });

    for (let d = 1; d <= daysInMonth; d++) {
      let inc = 0;
      let exp = 0;
      let count = 0;

      for (const tx of validTx) {
        const dateObj = new Date(tx.occurred_at);
        if (
          dateObj.getFullYear() === start.getFullYear() &&
          dateObj.getMonth() === start.getMonth() &&
          dateObj.getDate() === d
        ) {
          count++;
          if (tx.type === "income") inc += Number(tx.amount) || 0;
          if (tx.type === "expense") exp += Number(tx.amount) || 0;
        }
      }

      const isKeyDate = d === 1 || d === 5 || d === 10 || d === 15 || d === 20 || d === 25 || d === daysInMonth;

      buckets.push({
        key: `d-${d}`,
        shortLabel: isKeyDate ? String(d) : "",
        fullLabel: `Tgl ${d} ${monthShort}`,
        income: inc,
        expense: exp,
        txCount: count,
      });
    }

    return buckets;
  }

  // Fallback for all_time or other periods: group by month
  const monthMap = new Map<string, TrendBucket>();
  for (const tx of validTx) {
    const d = new Date(tx.occurred_at);
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    const mLabel = d.toLocaleDateString("id-ID", { month: "short" });
    const full = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const ex = monthMap.get(mKey) || {
      key: mKey,
      shortLabel: mLabel,
      fullLabel: full,
      income: 0,
      expense: 0,
      txCount: 0,
    };
    ex.txCount++;
    if (tx.type === "income") ex.income += Number(tx.amount) || 0;
    if (tx.type === "expense") ex.expense += Number(tx.amount) || 0;
    monthMap.set(mKey, ex);
  }

  return Array.from(monthMap.values()).slice(-6);
}

export function AppleTrendChart({ transactions, period }: AppleTrendChartProps) {
  const isMonth = period.includes("month");
  const [granularity, setGranularity] = useState<"weekly" | "daily">("weekly");
  const [hovered, setHovered] = useState<TrendBucket | null>(null);

  const buckets = useMemo(() => {
    return buildTrendBuckets(transactions, period, granularity);
  }, [transactions, period, granularity]);

  const maxScale = useMemo(() => {
    let max = 1;
    for (const b of buckets) {
      if (b.expense > max) max = b.expense;
      if (b.income > max) max = b.income;
    }
    return max;
  }, [buckets]);

  const activeItem = hovered || null;

  // Determine peak expense item
  const peakExpense = useMemo(() => {
    if (buckets.length === 0) return null;
    let peak = buckets[0];
    for (const b of buckets) {
      if (b.expense > peak.expense) peak = b;
    }
    return peak.expense > 0 ? peak : null;
  }, [buckets]);

  return (
    <div className="apple-chart-container">
      {/* 1. Header with dynamic inspection values */}
      <div className="trend-inspection-header">
        <div className="inspection-title">
          <span>{activeItem ? activeItem.fullLabel : "Tren Aktivitas"}</span>
        </div>

        <div className="inspection-values">
          {activeItem ? (
            <>
              {activeItem.expense > 0 && (
                <span className="expense">
                  Keluar {formatIDR(activeItem.expense)}
                </span>
              )}
              {activeItem.income > 0 && (
                <span className="income">
                  {activeItem.expense > 0 ? " · " : ""}Masuk +{formatIDR(activeItem.income)}
                </span>
              )}
              {activeItem.expense === 0 && activeItem.income === 0 && (
                <span>Tidak ada transaksi</span>
              )}
            </>
          ) : peakExpense ? (
            <span>
              Puncak: <strong style={{ color: "var(--app-expense)", fontWeight: 600 }}>{peakExpense.shortLabel}</strong> ({formatIDR(peakExpense.expense)})
            </span>
          ) : (
            <span>Arahkan garis untuk rincian</span>
          )}

          {/* Granularity switch for monthly view */}
          {isMonth && (
            <div className="granularity-toggle">
              <button
                type="button"
                className={granularity === "weekly" ? "active" : ""}
                onClick={() => setGranularity("weekly")}
              >
                Minggu
              </button>
              <button
                type="button"
                className={granularity === "daily" ? "active" : ""}
                onClick={() => setGranularity("daily")}
              >
                Hari
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two calm lines compare daily/weekly income and expense. */}
      <div className="cashflow-line-chart" role="img" aria-label="Grafik garis pemasukan dan pengeluaran">
        <svg viewBox="0 0 640 220" preserveAspectRatio="none" aria-hidden="true">
          {[0, 1, 2, 3].map((line) => {
            const y = 20 + line * 48;
            return <line key={line} x1="34" x2="624" y1={y} y2={y} className="chart-grid-line" />;
          })}
          {buckets.length > 1 && (["income", "expense"] as const).map((kind) => {
            const points = buckets.map((bucket, index) => {
              const x = 36 + index * (586 / (buckets.length - 1));
              const amount = bucket[kind];
              const y = 164 - (amount / maxScale) * 132;
              return `${x},${y}`;
            }).join(" ");
            return <polyline key={kind} points={points} className={`cashflow-line ${kind}`} />;
          })}
          {buckets.map((bucket, index) => {
            const x = buckets.length > 1 ? 36 + index * (586 / (buckets.length - 1)) : 329;
            const isActive = activeItem?.key === bucket.key;
            return <g key={bucket.key} className="cashflow-line-point" onMouseEnter={() => setHovered(bucket)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(bucket)}>
              <circle cx={x} cy={164 - (bucket.income / maxScale) * 132} r={isActive ? 5 : 3} className="income-point" />
              <circle cx={x} cy={164 - (bucket.expense / maxScale) * 132} r={isActive ? 5 : 3} className="expense-point" />
            </g>;
          })}
        </svg>
        <div className="cashflow-line-labels">
          {buckets.map((bucket) => <span key={bucket.key}>{bucket.shortLabel}</span>)}
        </div>
      </div>

      {/* 3. Subtle Legend Indicator */}
      <div className="apple-chart-legend">
        <div className="legend-item">
          <span className="legend-dot income" />
          <span>Masuk</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot expense" />
          <span>Keluar</span>
        </div>
      </div>
    </div>
  );
}
