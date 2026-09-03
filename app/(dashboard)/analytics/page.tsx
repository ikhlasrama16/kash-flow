"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Scale,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/react-bits/page-transition";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { AnimatedNumber } from "@/components/react-bits/animated-number";
import { getAIReport } from "@/lib/api/reports";
import { ReportPeriod } from "@/types/report";
import { formatIDR } from "@/lib/utils";
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f43f5e",
  "#64748b",
];

const PERIOD_OPTIONS: { label: string; value: ReportPeriod }[] = [
  { label: "Hari Ini", value: "daily" },
  { label: "Minggu Ini", value: "weekly" },
  { label: "Bulan Ini", value: "monthly" },
];

export function AnalyticsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");

  const {
    data: report,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["ai-report", period],
    queryFn: () => getAIReport({ period }),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  const summary = report?.summary;
  const comparison = report?.comparison;
  const categories = report?.expense_by_category || [];
  const merchants = report?.top_merchants || [];
  const aiResult = report?.ai;

  const pieData = categories.map((c) => ({
    name: c.category || "Lainnya",
    value: c.amount,
  }));

  const isGenerating = isLoading || isFetching;

  return (
    <PageTransition>
      <div className="space-y-6 md:space-y-8">
        {/* Header with period toggle & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Analisis Finansial & AI
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Periode: {report?.start_date || "..."} s/d {report?.end_date || "..."} (Asia/Jakarta)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPeriod(opt.value)}
                    className={`relative px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "text-slate-900 dark:text-white font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAnalyticsPeriod"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 bg-white dark:bg-[#151c2e] rounded-xl shadow-xs border border-slate-200/60 dark:border-white/10"
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isGenerating}
              className="text-xs rounded-xl backdrop-blur-sm bg-white/80 dark:bg-white/5 cursor-pointer"
              title="Generate ulang analisis"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Menganalisis..." : "Perbarui"}</span>
            </Button>
          </div>
        </div>

        {/* 1. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income */}
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Pemasukan
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tabular-nums">
              <AnimatedNumber value={summary?.income || 0} showSign={Boolean(summary?.income)} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.transaction_count || 0} transaksi tercatat
            </p>
          </SpotlightCard>

          {/* Expense */}
          <SpotlightCard
            spotlightColor="rgba(244, 63, 94, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Pengeluaran
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3 tabular-nums">
              <AnimatedNumber value={summary?.expense ? -summary.expense : 0} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.expense_transaction_count || 0} kali belanja
              {comparison && ` • ${(comparison.expense_change_percentage ?? 0) >= 0 ? "+" : ""}${(comparison.expense_change_percentage ?? 0).toFixed(1)}%`}
            </p>
          </SpotlightCard>

          {/* Daily Average Expense */}
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Rata-rata Harian
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-3 tabular-nums">
              <AnimatedNumber value={summary?.average_daily_expense || 0} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Estimasi belanja per hari</p>
          </SpotlightCard>

          {/* Net Cashflow */}
          <SpotlightCard
            spotlightColor="rgba(59, 130, 246, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Surplus / Defisit
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-bold mt-3 tabular-nums ${
                (summary?.net_cashflow || 0) >= 0
                  ? "text-slate-900 dark:text-white"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              <AnimatedNumber
                value={summary?.net_cashflow || 0}
                showSign={(summary?.net_cashflow || 0) > 0}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {(summary?.net_cashflow || 0) >= 0 ? "Kondisi arus kas positif ✨" : "Defisit pengeluaran"}
            </p>
          </SpotlightCard>
        </div>

        {/* 2. AI Financial Report / Insights */}
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-transparent relative overflow-hidden backdrop-blur-xs shadow-md">
          {/* Subtle glowing orb */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-500 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <span>Analisis & Wawasan AI</span>
                  {aiResult?.status === "cached" && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400">
                      💾 Tersimpan di Cache
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Evaluasi komprehensif kondisi finansial, tren belanja & rekomendasi oleh AI
                </CardDescription>
              </div>
            </div>

            <Badge
              variant={
                aiResult?.status === "generated" || aiResult?.status === "cached"
                  ? "success"
                  : "secondary"
              }
              className="text-xs"
            >
              {aiResult?.status === "generated"
                ? "⚡ AI Baru Dihasilkan"
                : aiResult?.status === "cached"
                ? "✓ AI Aktif"
                : "AI Standar"}
            </Badge>
          </CardHeader>

          <CardContent className="pt-2">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090d16] animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      AI sedang menyusun laporan & evaluasi finansial...
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                      Menganalisis pola transaksi, menghitung perubahan arus kas, dan merumuskan saran penghematan.
                    </p>
                  </div>
                </motion.div>
              ) : aiResult?.content ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl bg-white/70 dark:bg-[#0e1424]/80 p-5 border border-emerald-500/20 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                    {aiResult.content}
                  </div>

                  {aiResult.model && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Dihasilkan dengan model: <code className="font-mono text-slate-300">{aiResult.model}</code></span>
                      </span>
                      {aiResult.generated_at && (
                        <span>Waktu: {new Date(aiResult.generated_at).toLocaleString("id-ID")}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] p-5 border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 text-center">
                  Laporan AI belum tersedia untuk periode ini atau sedang diproses.
                  Klik tombol <strong>Perbarui</strong> di atas untuk memicu analisis AI.
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* 3. Charts & Merchants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <Card className="border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Distribusi Kategori Belanja</CardTitle>
                <PieIcon className="w-4 h-4 text-slate-400" />
              </div>
              <CardDescription className="text-xs">Proporsi pengeluaran per kategori periode ini</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 text-center">
                  <PieIcon className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  <span>Belum ada pengeluaran pada periode ini</span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={4}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [formatIDR(Number(val) || 0), "Jumlah"]}
                        contentStyle={{
                          backgroundColor: "#0c111d",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Merchants List */}
          <Card className="border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Top Penerima / Merchant</CardTitle>
              <CardDescription className="text-xs">Penerima transaksi belanja terbesar</CardDescription>
            </CardHeader>
            <CardContent>
              {merchants.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 text-center">
                  <span>Belum ada riwayat merchant pada periode ini</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {merchants.map((m, idx) => (
                    <div
                      key={m.merchant || idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {m.merchant || "Tanpa Nama"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {m.transaction_count} transaksi
                          </div>
                        </div>
                      </div>

                      <div className="font-bold text-xs tabular-nums text-slate-900 dark:text-white shrink-0">
                        {formatIDR(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

export default AnalyticsPage;
