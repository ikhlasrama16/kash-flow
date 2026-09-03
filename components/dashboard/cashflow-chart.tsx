"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { ChartDataPoint } from "@/lib/utils/date-filter";
import { LineChart as LineChartIcon, BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface CashflowChartProps {
  data: ChartDataPoint[];
  income: number;
  expense: number;
  netCashflow: number;
  periodLabel: string;
  isLoading?: boolean;
}

export function CashflowChart({
  data,
  income,
  expense,
  netCashflow,
  periodLabel,
  isLoading,
}: CashflowChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // Fallback single-item chart if data is empty but totals exist
  const displayData =
    data.length > 0
      ? data
      : [
          {
            key: "Total",
            label: "Total Periode",
            Pemasukan: income,
            Pengeluaran: expense,
            Net: netCashflow,
            Cumulative: netCashflow,
            txCount: 0,
          },
        ];

  const hasData = income > 0 || expense > 0 || data.some((d) => d.Pemasukan > 0 || d.Pengeluaran > 0);

  return (
    <Card className="border-slate-200/80 dark:border-white/10 relative overflow-hidden backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-md">
      {/* Background glow decoration */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base md:text-lg">Arus Kas & Tren Keuangan</CardTitle>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              {periodLabel}
            </span>
          </div>
          <CardDescription className="text-xs">
            Perbandingan pemasukan, pengeluaran & akumulasi kas dari waktu ke waktu
          </CardDescription>
        </div>

        {/* View Toggle: Area/Line vs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              chartType === "area"
                ? "bg-white dark:bg-[#151c2e] text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Tampilan Garis / Area"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Garis</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              chartType === "bar"
                ? "bg-white dark:bg-[#151c2e] text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            title="Tampilan Diagram Batang"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Batang</span>
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-[280px] w-full flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-slate-400">Menghitung arus kas dan tren transaksi...</div>
          </div>
        ) : !hasData ? (
          <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
              <LineChartIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Belum ada pergerakan transaksi pada {periodLabel}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Pilih filter periode lain (seperti Bulan Lalu) atau catat transaksi baru.
            </p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  data={displayData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    {/* Income gradient */}
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    {/* Expense gradient */}
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    {/* Cumulative net gradient */}
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-white/5"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
                      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
                      if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                    width={55}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                    activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Pengeluaran"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                    activeDot={{ r: 5, stroke: "#f43f5e", strokeWidth: 2, fill: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Net"
                    name="Net Cashflow"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#netGrad)"
                    activeDot={{ r: 4, stroke: "#06b6d4", strokeWidth: 1 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={displayData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-white/5"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
                      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
                      if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                    width={55}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="Pemasukan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="Pengeluaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="Net"
                    name="Net Cashflow"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload?: ChartDataPoint;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur-md text-white min-w-[200px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <span className="font-semibold text-slate-200">{label || point?.label}</span>
        {point?.txCount !== undefined && point.txCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
            {point.txCount} transaksi
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400 capitalize">{entry.name}:</span>
            </div>
            <span
              className={`font-semibold tabular-nums ${
                entry.name === "Pemasukan"
                  ? "text-emerald-400"
                  : entry.name === "Pengeluaran"
                  ? "text-rose-400"
                  : entry.value >= 0
                  ? "text-cyan-400"
                  : "text-rose-400"
              }`}
            >
              {formatIDR(entry.value, { showSign: entry.name === "Net Cashflow" })}
            </span>
          </div>
        ))}

        {point?.Cumulative !== undefined && (
          <div className="pt-1.5 mt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Akumulasi:</span>
            <span className="font-medium text-slate-200 tabular-nums">
              {formatIDR(point.Cumulative, { showSign: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
