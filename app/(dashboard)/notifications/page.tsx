"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Smartphone,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Search,
  Calendar,
  X,
} from "lucide-react";
import { PageHeader, AddAction, LoadError } from "@/components/ui/finance";
import { Badge } from "@/components/ui/badge";
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

const STATUS_LABELS: Record<string, string> = {
  parsed: "Berhasil diparse",
  pending: "Menunggu",
  ignored: "Diabaikan",
  failed: "Gagal",
  detached: "Terlepas",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePresetKey>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const todayMax = getJakartaDateString();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
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
    const newEnd = end;
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
      <div className="finance-page notification-page">
        <PageHeader
          title="Log ingest"
          description={`Menampilkan ${filteredNotifications.length} dari ${notifications.length} notifikasi finansial.`}
          actions={<>
            <button type="button" className="secondary-action" onClick={() => void queryClient.invalidateQueries({ queryKey: ["notifications"] })} title="Perbarui daftar"><RefreshCw size={16} /><span>Muat ulang</span></button>
            <AddAction onClick={() => setTestModalOpen(true)}>Uji ingest notifikasi</AddAction>
          </>}
        />
        {isError && <LoadError onRetry={() => void refetch()}>Riwayat notifikasi belum berhasil dimuat.</LoadError>}

        {/* Filter Card */}
        <div className="surface notification-filters">
          {/* Row 1: Search & Status Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <label className="notification-search">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Cari aplikasi, pesan, parser, ID..."
                aria-label="Cari notifikasi"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            {/* Status Pills */}
            <div className="segmented-control notification-status-tabs" role="group" aria-label="Status notifikasi">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setStatusFilter(t.value)}
                  aria-pressed={statusFilter === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Date Range Section */}
          <div className="notification-date-row">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              {/* Presets */}
              <div className="segmented-control notification-date-tabs" role="group" aria-label="Periode notifikasi">
                {PRESETS.map((p) => {
                  const isActive = datePreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handlePresetSelect(p.key)}
                      aria-pressed={isActive}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Date Pickers */}
              {datePreset === "custom" && <div className="notification-date-fields">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Dari:</span>
                  <input
                    type="date"
                    max={todayMax}
                    value={startDate}
                    onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                    aria-label="Tanggal mulai"
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
                    aria-label="Tanggal akhir"
                  />
                </div>
              </div>}
            </div>

            {(startDate || endDate) && (
              <div className="notification-active-range">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rentang Aktif:</span>
                <strong>
                  {startDate ? formatIDDate(startDate) : "Awal"} — {endDate ? formatIDDate(endDate) : "Sekarang"}
                </strong>
              </div>
            )}
          </div>

          {/* Reset Filter Action */}
          {isFiltered && (
            <div className="notification-filter-summary">
              <span>{filteredNotifications.length} notifikasi sesuai filter</span>
              <button
                type="button"
                onClick={handleReset}
                className="filter-reset-btn"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* List of Notifications */}
        {isLoading ? (
          <div className="notification-skeletons">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="notification-skeleton skeleton-block"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="surface notification-empty">
            <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3>
              {isError ? "Notifikasi belum tersedia" : isFiltered ? "Tidak ada notifikasi yang cocok" : "Belum ada log notifikasi"}
            </h3>
            <p>
              {isError
                ? "Coba muat ulang untuk melihat riwayat notifikasi."
                : isFiltered
                  ? "Coba ubah pencarian, status, atau periode tanggal."
                  : "Notifikasi dari MacroDroid yang masuk melalui endpoint ingest akan tersimpan di sini."}
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {filteredNotifications.map((notif) => (
              <article
                key={notif.id}
                className={`surface notification-card status-${notif.status}`}
              >
                {/* Header row: App badge, Status, Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="notification-tags">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {notif.source_app}
                    </Badge>
                    <span className="notification-status">{STATUS_LABELS[notif.status] ?? notif.status}</span>
                    {notif.parser_name && <span className="notification-parser">via {notif.parser_name}</span>}
                  </div>

                  <span className="notification-timestamp">
                    {formatRelativeTime(notif.received_at)} ({formatDateTime(notif.received_at)})
                  </span>
                </div>

                {/* Content: Title & Body */}
                <div className="notification-content">
                  {notif.title && (
                    <div className="notification-title">
                      {notif.title}
                    </div>
                  )}
                  <div className="notification-body">
                    {notif.body}
                  </div>
                </div>

                {/* Footer: Error message or Linked transaction */}
                <div className="notification-footer">
                  {notif.error_message ? (
                    <div className="notification-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{notif.error_message}</span>
                    </div>
                  ) : notif.transaction_id ? (
                    <Link
                      href={`/transactions/${notif.transaction_id}`}
                      className="notification-transaction-link"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Terhubung ke Transaksi #{notif.transaction_id}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <div className="notification-no-transaction">Tidak menghasilkan transaksi</div>
                  )}

                  <span className="notification-id">
                    ID #{notif.id}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Test Simulator Modal */}
        <TestNotificationModal open={testModalOpen} onOpenChange={setTestModalOpen} />
      </div>
    </PageTransition>
  );
}
