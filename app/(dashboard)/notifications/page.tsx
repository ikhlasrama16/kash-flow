"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  RefreshCw,
  Send,
  Smartphone,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Search,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NotificationStatusBadge, Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { TestNotificationModal } from "@/components/notifications/test-notification-modal";
import { getNotifications } from "@/lib/api/notifications";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import {
  DatePresetKey,
  getJakartaDateString,
  getPresetDates,
  formatIDDate,
  isDateInDateRange,
} from "@/lib/utils/date-filter";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Semua", value: "all" },
  { label: "Berhasil Diparse", value: "parsed" },
  { label: "Pending", value: "pending" },
  { label: "Diabaikan (Promo)", value: "ignored" },
  { label: "Gagal", value: "failed" },
];

const PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: "all", label: "Semua Waktu" },
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "this_week", label: "Minggu Ini" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "custom", label: "Kustom" },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePresetKey>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const todayMax = getJakartaDateString();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const handlePresetSelect = (preset: DatePresetKey) => {
    if (preset === "custom") {
      setDatePreset("custom");
      return;
    }
    const { startDate: s, endDate: e } = getPresetDates(preset);
    setDatePreset(preset);
    setStartDate(s);
    setEndDate(e);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    let newStart = start;
    let newEnd = end;
    if (newStart && newEnd && newStart > newEnd) {
      newStart = newEnd;
    }
    setDatePreset("custom");
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
  };

  const isFiltered =
    search !== "" ||
    statusFilter !== "all" ||
    datePreset !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (statusFilter !== "all" && n.status !== statusFilter) return false;

      // Date range filter
      if (!isDateInDateRange(n.received_at, startDate, endDate)) return false;

      // Search query filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(query);
        const bodyMatch = n.body?.toLowerCase().includes(query);
        const appMatch = n.source_app?.toLowerCase().includes(query);
        const parserMatch = n.parser_name?.toLowerCase().includes(query);
        const errorMatch = n.error_message?.toLowerCase().includes(query);
        const idMatch = String(n.id) === query || String(n.transaction_id) === query;

        if (!titleMatch && !bodyMatch && !appMatch && !parserMatch && !errorMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, statusFilter, startDate, endDate, search]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Log Ingest Notifikasi
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Menampilkan {filteredNotifications.length} dari {notifications.length} riwayat notifikasi finansial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })}
              className="text-xs"
              title="Perbarui daftar"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Muat Ulang</span>
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setTestModalOpen(true)}
              className="text-xs font-semibold shadow-md shadow-emerald-500/20"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Uji Ingest Notifikasi</span>
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="space-y-3 bg-white dark:bg-[#0e1422] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          {/* Row 1: Search & Status Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari aplikasi, pesan, parser, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 shrink-0 overflow-x-auto">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setStatusFilter(t.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === t.value
                      ? "bg-white dark:bg-[#161e31] text-slate-900 dark:text-white shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Date Range Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              {/* Presets */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto">
                {PRESETS.map((p) => {
                  const isActive = datePreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handlePresetSelect(p.key)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-white dark:bg-[#161e31] text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Date Pickers */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Dari:</span>
                  <input
                    type="date"
                    max={todayMax}
                    value={startDate}
                    onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                    className="px-2.5 py-1 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  />
                </div>

                <span className="text-slate-400 text-xs">s/d</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Sampai:</span>
                  <input
                    type="date"
                    max={todayMax}
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                    className="px-2.5 py-1 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {(startDate || endDate) && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rentang Aktif:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {startDate ? formatIDDate(startDate) : "Awal"} — {endDate ? formatIDDate(endDate) : "Sekarang"}
                </span>
              </div>
            )}
          </div>

          {/* Reset Filter Action */}
          {isFiltered && (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <span>Filter diterapkan ({filteredNotifications.length} ditemukan)</span>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* List of Notifications */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422]">
            <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Belum ada log notifikasi
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Notifikasi yang dikirim oleh MacroDroid ke endpoint POST /api/v1/notifications akan
              tersimpan di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                className="border-slate-200/80 dark:border-white/10 p-4 hover:border-emerald-500/30 transition-all space-y-2.5"
              >
                {/* Header row: App badge, Status, Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {notif.source_app}
                    </Badge>
                    <NotificationStatusBadge status={notif.status} />
                    {notif.parser_name && (
                      <span className="text-[10px] text-slate-400">
                        via <span className="font-medium text-slate-300">{notif.parser_name}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatRelativeTime(notif.received_at)} ({formatDateTime(notif.received_at)})
                  </span>
                </div>

                {/* Content: Title & Body */}
                <div className="space-y-1">
                  {notif.title && (
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {notif.title}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 break-words">
                    {notif.body}
                  </div>
                </div>

                {/* Footer: Error message or Linked transaction */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {notif.error_message ? (
                    <div className="flex items-center gap-1.5 text-rose-500 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{notif.error_message}</span>
                    </div>
                  ) : notif.transaction_id ? (
                    <Link
                      href={`/transactions/${notif.transaction_id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Terhubung ke Transaksi #{notif.transaction_id}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <div className="text-[11px] text-slate-400">Tidak menghasilkan transaksi</div>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono">
                    ID #{notif.id}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Test Simulator Modal */}
        <TestNotificationModal open={testModalOpen} onOpenChange={setTestModalOpen} />
      </div>
    </PageTransition>
  );
}
