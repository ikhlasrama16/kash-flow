"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingestNotification } from "@/lib/api/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

interface TestNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_NOTIFICATIONS = [
  {
    label: "SeaBank: QRIS Warung Rp25.000",
    source_app: "com.seabank.id",
    title: "Pembayaran Berhasil",
    body: "Pembayaran QRIS untuk WARUNG MAKMUR sebesar Rp25.000 berhasil dilakukan.",
  },
  {
    label: "SeaBank: Transfer Masuk Rp500.000",
    source_app: "com.seabank.id",
    title: "Dana Masuk",
    body: "Transfer masuk sebesar Rp500.000 dari BUDI SANTOSO berhasil diterima.",
  },
  {
    label: "ShopeePay: Top Up Rp100.000",
    source_app: "com.shopee.id",
    title: "Isi Saldo Berhasil",
    body: "Isi saldo ShopeePay sebesar Rp100.000 berhasil.",
  },
];

export function TestNotificationModal({ open, onOpenChange }: TestNotificationModalProps) {
  const queryClient = useQueryClient();

  const [sourceApp, setSourceApp] = useState("com.seabank.id");
  const [title, setTitle] = useState("Pembayaran Berhasil");
  const [body, setBody] = useState(
    "Pembayaran QRIS untuk WARUNG MAKMUR sebesar Rp25.000 berhasil dilakukan."
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ingestNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      setSuccessMessage("Notifikasi berhasil dikirim dan diproses oleh parser Go!");
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
      }, 1200);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal mengirim notifikasi");
    },
  });

  const handleSelectSample = (sample: (typeof SAMPLE_NOTIFICATIONS)[0]) => {
    setSourceApp(sample.source_app);
    setTitle(sample.title);
    setBody(sample.body);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!sourceApp.trim() || !body.trim()) {
      setError("Source App dan Body notifikasi wajib diisi");
      return;
    }

    mutation.mutate({
      source_app: sourceApp.trim(),
      title: title.trim() || undefined,
      body: body.trim(),
      received_at: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          Simulasi Notifikasi MacroDroid
        </DialogTitle>
        <DialogDescription>
          Kirim payload notifikasi perbankan untuk menguji engine parser otomatis Go backend.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {successMessage}
        </div>
      )}

      {/* Preset samples */}
      <div className="space-y-1.5 mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Pilih Contoh Notifikasi:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_NOTIFICATIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(s)}
              className="px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer bg-slate-50 dark:bg-white/[0.02]"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Source Application ID *
          </label>
          <Input
            value={sourceApp}
            onChange={(e) => setSourceApp(e.target.value)}
            placeholder="com.seabank.id"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Judul Notifikasi (Title)
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pembayaran Berhasil"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Isi Notifikasi (Body Text) *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
            required
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Batal
          </Button>
          <Button type="submit" variant="emerald" isLoading={mutation.isPending}>
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>Kirim & Parse</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
