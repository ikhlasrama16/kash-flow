"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
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
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/react-bits/page-transition";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { AnimatedNumber } from "@/components/react-bits/animated-number";
import { Markdown } from "@/components/ui/markdown";
import {
  DateRangeFilter,
  DateRangeState,
  getPresetDates,
  formatIDDate,
} from "@/components/analytics/date-range-filter";
import {
  getReportStatisticsV2,
  createAIReportV2,
  getAIReportJobV2,
} from "@/lib/api/reports";
import {
  ReportStatisticsV2,
  AIJobResponseV2,
  AIJobStatus,
} from "@/types/report";
import { ApiError } from "@/lib/api/client";
import { formatIDR } from "@/lib/utils";

// Dynamic import for Recharts PieChart (optimized for mobile JS parsing)
const ResponsivePieChart = dynamic(
  () =>
    import("recharts").then((recharts) => {
      const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = recharts;
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

      return function DynamicPieChart({
        data,
      }: {
        data: Array<{ name: string; value: number }>;
      }) {
        if (!data || data.length === 0) return null;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={4}
              >
                {data.map((_, index) => (
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
        );
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400">Memuat diagram...</span>
      </div>
    ),
  }
);

export function AnalyticsPage() {
  // Default range: This Month
  const initialPreset = getPresetDates("this_month");
  const [rangeState, setRangeState] = useState<DateRangeState>({
    preset: "this_month",
    startDate: initialPreset.startDate,
    endDate: initialPreset.endDate,
    comparison: "previous_equivalent",
  });

  // Statistics state
  const [statistics, setStatistics] = useState<ReportStatisticsV2 | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // AI Job state
  const [aiStatus, setAiStatus] = useState<AIJobStatus | "idle">("idle");
  const [aiJob, setAiJob] = useState<AIJobResponseV2 | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Active polling timeout reference & cancellation controllers
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentSnapshotHashRef = useRef<string | null>(null);

  // Stop polling and cancel in-flight requests
  const cleanupAsyncTasks = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Poll AI job by ID until complete or failed
  const pollAIJob = useCallback((jobId: string, signal: AbortSignal) => {
    if (signal.aborted) return;

    const executePoll = async () => {
      try {
        const jobResult = await getAIReportJobV2(jobId, signal);
        if (signal.aborted) return;

        setAiJob(jobResult);
        setAiStatus(jobResult.status);

        if (jobResult.status === "complete") {
          setAiError(null);
          // Polling finished successfully
          return;
        }

        if (jobResult.status === "failed") {
          setAiError(jobResult.error || "Gagal menghasilkan analisis AI.");
          return;
        }

        // Still queued or running -> poll again after 1.5 seconds
        if (jobResult.status === "queued" || jobResult.status === "running") {
          pollTimeoutRef.current = setTimeout(() => {
            pollAIJob(jobId, signal);
          }, 1500);
        }
      } catch (err: unknown) {
        if (signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Terjadi kendala saat memeriksa status AI.";
        setAiStatus("failed");
        setAiError(msg);
      }
    };

    executePoll();
  }, []);

  // Request AI insight job using snapshot_hash
  const triggerAIReport = useCallback(
    async (
      statsData: ReportStatisticsV2,
      signal: AbortSignal,
      isRetryAfterConflict = false
    ) => {
      if (signal.aborted) return;

      setAiStatus("queued");
      setAiError(null);

      try {
        const response = await createAIReportV2(
          {
            start_date: statsData.range.start_date,
            end_date: statsData.range.end_date,
            comparison: {
              mode: statsData.comparison_mode,
              start_date: statsData.comparison_range?.start_date,
              end_date: statsData.comparison_range?.end_date,
            },
            snapshot_hash: statsData.snapshot_hash,
          },
          signal
        );

        if (signal.aborted) return;

        setAiJob(response);
        setAiStatus(response.status);

        if (response.status === "complete") {
          // Instant cache hit!
          return;
        }

        if (response.status === "failed") {
          setAiError(response.error || "Gagal membuat job analisis.");
          return;
        }

        // Job is queued or running -> start polling
        pollAIJob(response.id, signal);
      } catch (err: unknown) {
        if (signal.aborted) return;

        // If backend returned 409 Conflict (stale snapshot_hash), re-fetch statistics and retry once
        if (err instanceof ApiError && err.status === 409 && !isRetryAfterConflict) {
          console.warn("[Analytics] Snapshot hash stale (409 Conflict), fetching fresh statistics...");
          try {
            const freshStats = await getReportStatisticsV2(
              {
                start_date: rangeState.startDate,
                end_date: rangeState.endDate,
                comparison: rangeState.comparison,
              },
              signal
            );
            if (signal.aborted) return;
            setStatistics(freshStats);
            currentSnapshotHashRef.current = freshStats.snapshot_hash;
            // Retry creating AI report with fresh hash
            triggerAIReport(freshStats, signal, true);
            return;
          } catch (fetchErr) {
            if (signal.aborted) return;
            setAiStatus("failed");
            setAiError("Gagal memperbarui data transaksi terbaru.");
            return;
          }
        }

        const msg = err instanceof Error ? err.message : "Gagal memulai analisis AI.";
        setAiStatus("failed");
        setAiError(msg);
      }
    },
    [pollAIJob, rangeState]
  );

  // Main fetch function for a given date range & comparison
  const loadReport = useCallback(
    async (currentRange: DateRangeState) => {
      cleanupAsyncTasks();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStatsLoading(true);
      setStatsError(null);
      setAiStatus("idle");
      setAiJob(null);
      setAiError(null);

      try {
        // Step 1: Ambil statistik dahulu dari GET /api/v2/reports/statistics
        const statsData = await getReportStatisticsV2(
          {
            start_date: currentRange.startDate,
            end_date: currentRange.endDate,
            comparison: currentRange.comparison,
            comparison_start_date: currentRange.comparisonStartDate,
            comparison_end_date: currentRange.comparisonEndDate,
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        // Tampilkan statistik segera tanpa menunggu AI
        setStatistics(statsData);
        setStatsLoading(false);
        currentSnapshotHashRef.current = statsData.snapshot_hash;

        // Step 2: POST /api/v2/reports/ai memakai snapshot_hash
        triggerAIReport(statsData, controller.signal);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setStatsLoading(false);
        const msg = err instanceof Error ? err.message : "Gagal memuat statistik keuangan.";
        setStatsError(msg);
      }
    },
    [cleanupAsyncTasks, triggerAIReport]
  );

  // Load report on mount or when rangeState changes
  useEffect(() => {
    loadReport(rangeState);

    return () => {
      cleanupAsyncTasks();
    };
  }, [rangeState, loadReport, cleanupAsyncTasks]);

  // Manual refresh handler
  const handleRefresh = () => {
    loadReport(rangeState);
  };

  // Manual retry AI handler
  const handleRetryAI = () => {
    if (!statistics) {
      handleRefresh();
      return;
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    triggerAIReport(statistics, controller.signal);
  };

  const summary = statistics?.summary;
  const comparison = statistics?.comparison;
  const categories = statistics?.expense_by_category || [];
  const merchants = statistics?.top_merchants || [];

  const pieData = categories.map((c) => ({
    name: c.category || "Lainnya",
    value: c.amount,
  }));

  const isAILoading = aiStatus === "queued" || aiStatus === "running";

  return (
    <PageTransition>
      <div className="space-y-6 md:space-y-8">
        {/* Header with Title, Range Picker & Refresh */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Laporan & Analisis AI v2
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Rentang: {formatIDDate(rangeState.startDate)} s/d {formatIDDate(rangeState.endDate)} (Asia/Jakarta)
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={statsLoading}
                className="text-xs rounded-xl bg-white dark:bg-white/5 cursor-pointer"
                title="Muat ulang laporan"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${statsLoading ? "animate-spin" : ""}`} />
                <span>{statsLoading ? "Memuat..." : "Perbarui"}</span>
              </Button>
            </div>
          </div>

          {/* Date Range & Comparison Selector */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c111d] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <DateRangeFilter
              value={rangeState}
              onChange={(newVal) => setRangeState(newVal)}
              disabled={statsLoading}
            />
          </div>
        </div>

        {/* Error State for Statistics */}
        {statsError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statsError}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs h-7 border-rose-500/30 text-rose-600 dark:text-rose-400 cursor-pointer"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* 1. Top Metric Cards (Rendered immediately after statistics arrive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income */}
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs"
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
              {statsLoading ? (
                <div className="h-7 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <AnimatedNumber value={summary?.income || 0} showSign={Boolean(summary?.income)} />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.transaction_count !== undefined
                ? `${summary.transaction_count} transaksi total`
                : "Periode ini"}
            </p>
          </SpotlightCard>

          {/* Expense */}
          <SpotlightCard
            spotlightColor="rgba(244, 63, 94, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs"
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
              {statsLoading ? (
                <div className="h-7 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <AnimatedNumber value={summary?.expense ? -summary.expense : 0} />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.expense_transaction_count || 0} kali belanja
              {comparison &&
                ` • ${(comparison.expense_change_percentage ?? 0) >= 0 ? "+" : ""}${(
                  comparison.expense_change_percentage ?? 0
                ).toFixed(1)}% vs lalu`}
            </p>
          </SpotlightCard>

          {/* Daily Average Expense */}
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs"
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
              {statsLoading ? (
                <div className="h-7 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <AnimatedNumber value={summary?.average_daily_expense || 0} />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Estimasi pengeluaran per hari</p>
          </SpotlightCard>

          {/* Net Cashflow */}
          <SpotlightCard
            spotlightColor="rgba(59, 130, 246, 0.12)"
            className="p-5 border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs"
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
              {statsLoading ? (
                <div className="h-7 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <AnimatedNumber
                  value={summary?.net_cashflow || 0}
                  showSign={(summary?.net_cashflow || 0) > 0}
                />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {(summary?.net_cashflow || 0) >= 0
                ? "Kondisi arus kas positif ✨"
                : "Defisit pengeluaran"}
            </p>
          </SpotlightCard>
        </div>

        {/* 2. Asynchronous AI Insights & Analysis v2 */}
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-transparent relative overflow-hidden shadow-xs">
          <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-500 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <span>Wawasan & Evaluasi AI v2</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Analisis asinkron berbasis snapshot transaksi rentang tanggal
                </CardDescription>
              </div>
            </div>

            {/* AI Status Badge */}
            <Badge
              variant={
                aiStatus === "complete"
                  ? "success"
                  : aiStatus === "failed"
                  ? "danger"
                  : "secondary"
              }
              className="text-xs capitalize"
            >
              {aiStatus === "queued" && "⏳ Menyiapkan..."}
              {aiStatus === "running" && "⚡ Menganalisis..."}
              {aiStatus === "complete" && "✓ Selesai"}
              {aiStatus === "failed" && "✕ Gagal"}
              {aiStatus === "idle" && "Standby"}
            </Badge>
          </CardHeader>

          <CardContent className="pt-2">
            {/* 1. Loading / Queued / Running State */}
            {isAILoading && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090d16] animate-ping" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {aiStatus === "queued"
                      ? "Menyiapkan analisis..."
                      : "Menganalisis transaksi..."}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {aiStatus === "queued"
                      ? "Permintaan telah masuk antrean pemrosesan AI."
                      : "AI sedang mengevaluasi pola belanja, menghitung proyeksi kas, dan menyusun saran finansial."}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Failed State with Retry Button */}
            {aiStatus === "failed" && !isAILoading && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 p-5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tidak dapat menyelesaikan analisis AI
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                    {aiError || "Terjadi kesalahan pada backend atau kuota AI sedang padat."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryAI}
                  className="text-xs rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Coba Lagi</span>
                </Button>
              </div>
            )}

            {/* 3. Complete State with Sanitized Markdown */}
            {aiStatus === "complete" && aiJob?.content && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/70 dark:bg-[#0e1424]/80 p-5 border border-emerald-500/20 shadow-xs">
                  <Markdown content={aiJob.content} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
                  {aiJob.model && (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        Model: <code className="font-mono text-slate-300">{aiJob.model}</code>
                      </span>
                    </span>
                  )}

                  {aiJob.generated_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(aiJob.generated_at).toLocaleString("id-ID")}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 4. Idle or empty state */}
            {aiStatus === "idle" && !isAILoading && !aiJob && (
              <div className="py-6 text-center text-xs text-slate-400">
                Pilih rentang tanggal untuk memulai analisis keuangan otomatis.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Charts & Top Merchants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Pie Chart */}
          <Card className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Distribusi Kategori Belanja</CardTitle>
                <PieIcon className="w-4 h-4 text-slate-400" />
              </div>
              <CardDescription className="text-xs">
                Proporsi pengeluaran per kategori pada rentang ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <span className="text-xs text-slate-400">Memuat statistik kategori...</span>
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 text-center">
                  <PieIcon className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                  <span>Belum ada transaksi belanja pada periode ini</span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsivePieChart data={pieData} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Merchants List */}
          <Card className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c111d] shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Top Penerima / Merchant</CardTitle>
              <CardDescription className="text-xs">
                Penerima transaksi belanja terbesar pada rentang ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <span className="text-xs text-slate-400">Memuat daftar merchant...</span>
                </div>
              ) : merchants.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 text-center">
                  <span>Belum ada riwayat merchant pada rentang ini</span>
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
