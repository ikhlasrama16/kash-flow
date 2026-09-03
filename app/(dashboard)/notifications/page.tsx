"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, RefreshCw, Send, Smartphone, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationStatusBadge, Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { TestNotificationModal } from "@/components/notifications/test-notification-modal";
import { getNotifications } from "@/lib/api/notifications";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const filteredNotifications = notifications.filter((n) => {
    if (statusFilter !== "all" && n.status !== statusFilter) return false;
    return true;
  });

  const STATUS_TABS: { label: string; value: string }[] = [
    { label: "Semua", value: "all" },
    { label: "Berhasil Diparse", value: "parsed" },
    { label: "Pending", value: "pending" },
    { label: "Diabaikan (Promo)", value: "ignored" },
    { label: "Gagal", value: "failed" },
  ];

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
              Catatan riwayat notifikasi finansial dari perangkat Android / MacroDroid.
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === t.value
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
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
