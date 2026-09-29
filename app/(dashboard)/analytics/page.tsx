"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
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
import { PageHeader, SegmentedControl, LoadError } from "@/components/ui/finance";
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

// Dynamic import for Recharts PieChart (optimized for client rendering)
const ResponsivePieChart = dynamic(
  () =>
    import("recharts").then((recharts) => {
      const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = recharts;
      const PIE_COLORS = [
        "#0066d6", // Apple Blue
        "#f99542", // Apple Orange
        "#34c759", // Apple Green
        "#af52de", // Apple Purple
        "#5856d6", // Apple Indigo
        "#ff2d55", // Apple Pink
        "#00c7be", // Apple Teal
        "#8e8e93", // Apple Gray
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
                  backgroundColor: "var(--app-surface)",
                  borderColor: "var(--app-line)",
                  borderRadius: "12px",
                  color: "var(--app-text)",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                itemStyle={{ color: "var(--app-text)" }}
                labelStyle={{ color: "var(--app-muted)", fontWeight: 600 }}
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
        <Loader2 className="w-5 h-5 text-[var(--app-blue)] animate-spin" />
        <span className="text-xs text-[var(--app-muted)]">Memuat diagram...</span>
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

  // Toggle between Pengeluaran and Pemasukan breakdown
  const [breakdownType, setBreakdownType] = useState<"expense" | "income">("expense");

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

  // Data depending on active breakdownType (expense vs income)
  const currentCategories =
    breakdownType === "expense"
      ? statistics?.expense_by_category || []
      : statistics?.income_by_category || [];

  const currentRanking =
    breakdownType === "expense"
      ? statistics?.top_merchants || []
      : statistics?.top_income_sources || [];

  const pieData = currentCategories.map((c) => ({
    name: c.category || "Lainnya",
    value: c.amount,
  }));

  const isAILoading = aiStatus === "queued" || aiStatus === "running";

  return (
    <div className="finance-page analytics-page">
      {/* Header */}
      <PageHeader
        title="Laporan & Analisis AI"
        description={`Rentang: ${formatIDDate(rangeState.startDate)} s/d ${formatIDDate(rangeState.endDate)} (Asia/Jakarta)`}
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={statsLoading}
            className="text-action create-action"
            style={{ height: "36px", padding: "0 14px" }}
          >
            <RefreshCw size={15} className={statsLoading ? "animate-spin" : ""} />
            <span>{statsLoading ? "Memuat..." : "Perbarui"}</span>
          </button>
        }
      />

      {/* Date Range & Comparison Selector */}
      <div className="surface" style={{ padding: "16px 20px" }}>
        <DateRangeFilter
          value={rangeState}
          onChange={(newVal) => setRangeState(newVal)}
          disabled={statsLoading}
        />
      </div>

      {/* Error State for Statistics */}
      {statsError && (
        <LoadError onRetry={handleRefresh}>
          {statsError}
        </LoadError>
      )}

      {/* 1. Top Metric Cards */}
      <div className="analytics-stats-grid">
        {/* Total Income */}
        <div className="surface stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Pemasukan</span>
            <div className="stat-card-icon income">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: "var(--app-blue)" }}>
            {statsLoading ? (
              <div className="h-8 w-32 bg-black/[0.06] dark:bg-white/[0.08] rounded-lg animate-pulse" />
            ) : (
              <AnimatedNumber value={summary?.income || 0} showSign={Boolean(summary?.income)} />
            )}
          </div>
          <p className="stat-card-sub">
            {comparison?.income_change_percentage !== undefined ? (
              <span>
                {comparison.income_change_percentage >= 0 ? "+" : ""}
                {comparison.income_change_percentage.toFixed(1)}% vs lalu
              </span>
            ) : summary?.transaction_count !== undefined ? (
              `${summary.transaction_count} transaksi total`
            ) : (
              "Periode ini"
            )}
          </p>
        </div>

        {/* Total Expense */}
        <div className="surface stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Pengeluaran</span>
            <div className="stat-card-icon expense">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: "var(--app-orange)" }}>
            {statsLoading ? (
              <div className="h-8 w-32 bg-black/[0.06] dark:bg-white/[0.08] rounded-lg animate-pulse" />
            ) : (
              <AnimatedNumber value={summary?.expense ? -summary.expense : 0} />
            )}
          </div>
          <p className="stat-card-sub">
            {summary?.expense_transaction_count || 0} kali belanja
            {comparison?.expense_change_percentage !== undefined &&
              ` • ${comparison.expense_change_percentage >= 0 ? "+" : ""}${comparison.expense_change_percentage.toFixed(1)}% vs lalu`}
          </p>
        </div>

        {/* Daily Average Expense */}
        <div className="surface stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Rata-rata Harian</span>
            <div className="stat-card-icon neutral">
              <Calendar size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: "var(--app-text)" }}>
            {statsLoading ? (
              <div className="h-8 w-32 bg-black/[0.06] dark:bg-white/[0.08] rounded-lg animate-pulse" />
            ) : (
              <AnimatedNumber value={summary?.average_daily_expense || 0} />
            )}
          </div>
          <p className="stat-card-sub">Estimasi pengeluaran per hari</p>
        </div>

        {/* Net Cashflow */}
        <div className="surface stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Surplus / Defisit</span>
            <div className="stat-card-icon neutral">
              <Scale size={18} />
            </div>
          </div>
          <div
            className="stat-card-value"
            style={{
              color:
                (summary?.net_cashflow || 0) < 0
                  ? "var(--app-orange)"
                  : "var(--app-text)",
            }}
          >
            {statsLoading ? (
              <div className="h-8 w-32 bg-black/[0.06] dark:bg-white/[0.08] rounded-lg animate-pulse" />
            ) : (
              <AnimatedNumber
                value={summary?.net_cashflow || 0}
                showSign={(summary?.net_cashflow || 0) > 0}
              />
            )}
          </div>
          <p className="stat-card-sub">
            {(summary?.net_cashflow || 0) >= 0
              ? "Kondisi arus kas positif"
              : "Defisit pengeluaran"}
          </p>
        </div>
      </div>

      {/* 2. Asynchronous AI Insights & Analysis v2 */}
      <section className="surface ai-insight-panel">
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <div className="stat-card-icon income">
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Evaluasi & Saran AI</h3>
              <p style={{ fontSize: "12px", color: "var(--app-muted)", margin: 0 }}>
                Analisis 360° pola belanja, kestabilan pemasukan, dan arus kas
              </p>
            </div>
          </div>

          <span className={`ai-status-pill ${aiStatus}`}>
            {aiStatus === "queued" && "Menyiapkan..."}
            {aiStatus === "running" && "Menganalisis..."}
            {aiStatus === "complete" && "Selesai"}
            {aiStatus === "failed" && "Gagal"}
            {aiStatus === "idle" && "Standby"}
          </span>
        </div>

        {/* 1. Loading / Queued / Running State */}
        {isAILoading && (
          <div style={{ padding: "36px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "color-mix(in srgb, var(--app-blue) 12%, transparent)", color: "var(--app-blue)", display: "grid", placeItems: "center" }}>
              <Bot size={24} className="animate-pulse" />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                {aiStatus === "queued"
                  ? "Menyiapkan analisis..."
                  : "Menganalisis transaksi..."}
              </p>
              <p style={{ fontSize: "12px", color: "var(--app-muted)", marginTop: "4px", maxWidth: "380px" }}>
                {aiStatus === "queued"
                  ? "Permintaan telah masuk antrean pemrosesan AI."
                  : "AI sedang mengevaluasi pengeluaran vs pemasukan, menghitung rasio tabungan, dan menyusun saran finansial."}
              </p>
            </div>
          </div>
        )}

        {/* 2. Failed State with Retry Button */}
        {aiStatus === "failed" && !isAILoading && (
          <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "12px", borderRadius: "14px", background: "rgba(239, 68, 68, 0.05)" }}>
            <AlertCircle size={24} style={{ color: "#ef4444" }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
                Tidak dapat menyelesaikan analisis AI
              </p>
              <p style={{ fontSize: "12px", color: "var(--app-muted)", marginTop: "4px", maxWidth: "400px" }}>
                {aiError || "Terjadi kesalahan pada backend atau kuota AI sedang padat."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetryAI}
              className="text-action"
              style={{ fontSize: "12px" }}
            >
              <RefreshCw size={14} />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* 3. Complete State with Sanitized Markdown */}
        {aiStatus === "complete" && aiJob?.content && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="ai-content-box">
              <Markdown content={aiJob.content} />
            </div>

            <div className="ai-meta">
              {aiJob.model && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--app-blue)" }} />
                  <span>Model: <code>{aiJob.model}</code></span>
                </span>
              )}

              {aiJob.generated_at && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={14} />
                  <span>{new Date(aiJob.generated_at).toLocaleString("id-ID")}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* 4. Idle or empty state */}
        {aiStatus === "idle" && !isAILoading && !aiJob && (
          <div style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--app-muted)" }}>
            Pilih rentang tanggal untuk memulai analisis keuangan otomatis.
          </div>
        )}
      </section>

      {/* 3. Charts & Top Rankings Grid with Income/Expense Switcher */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
              Rincian & Peringkat Transaksi
            </h2>
            <p style={{ fontSize: "12px", color: "var(--app-muted)", margin: "2px 0 0" }}>
              Analisis proporsi kategori dan daftar pihak penerima/sumber dana
            </p>
          </div>
          <SegmentedControl
            value={breakdownType}
            onChange={(v) => setBreakdownType(v)}
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
            ]}
            label="Pilih jenis rincian transaksi"
          />
        </div>

        <div className="analytics-charts-grid">
          {/* Category Breakdown Pie Chart */}
          <div className="surface chart-panel">
            <div className="chart-panel-header">
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                  {breakdownType === "expense"
                    ? "Distribusi Kategori Belanja"
                    : "Distribusi Sumber Pemasukan"}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--app-muted)", margin: "4px 0 0" }}>
                  {breakdownType === "expense"
                    ? "Proporsi pengeluaran per kategori pada rentang ini"
                    : "Proporsi pemasukan per kategori pada rentang ini"}
                </p>
              </div>
              <PieIcon size={18} style={{ color: "var(--app-muted)" }} />
            </div>

            <div>
              {statsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-[var(--app-blue)] animate-spin" />
                  <span className="text-xs text-[var(--app-muted)]">Memuat statistik kategori...</span>
                </div>
              ) : pieData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-[var(--app-muted)] text-center">
                  <PieIcon className="w-8 h-8 text-[var(--app-muted)] mb-2 opacity-40" />
                  <span>
                    {breakdownType === "expense"
                      ? "Belum ada transaksi belanja pada periode ini"
                      : "Belum ada transaksi pemasukan pada periode ini"}
                  </span>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsivePieChart data={pieData} />
                </div>
              )}
            </div>
          </div>

          {/* Top Merchants / Payers List */}
          <div className="surface chart-panel">
            <div className="chart-panel-header">
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                  {breakdownType === "expense"
                    ? "Top Penerima / Merchant"
                    : "Top Pembayar / Sumber Dana"}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--app-muted)", margin: "4px 0 0" }}>
                  {breakdownType === "expense"
                    ? "Penerima transaksi belanja terbesar pada rentang ini"
                    : "Sumber dana pemasukan terbesar pada rentang ini"}
                </p>
              </div>
            </div>

            <div>
              {statsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-[var(--app-blue)] animate-spin" />
                  <span className="text-xs text-[var(--app-muted)]">Memuat daftar peringkat...</span>
                </div>
              ) : currentRanking.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-[var(--app-muted)] text-center">
                  <span>
                    {breakdownType === "expense"
                      ? "Belum ada riwayat merchant pada rentang ini"
                      : "Belum ada riwayat sumber dana pada rentang ini"}
                  </span>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {currentRanking.map((m, idx) => (
                    <div key={m.merchant || idx} className="merchant-rank-row">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div className="merchant-rank-badge">
                          #{idx + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--app-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.merchant || "Tanpa Nama"}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--app-muted)" }}>
                            {m.transaction_count} transaksi
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          fontVariantNumeric: "tabular-nums",
                          color: breakdownType === "income" ? "var(--app-blue)" : "var(--app-text)",
                          flexShrink: 0,
                        }}
                      >
                        {breakdownType === "income" ? "+" : ""}{formatIDR(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPage;
