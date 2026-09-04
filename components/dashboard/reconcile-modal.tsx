"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Account } from "@/types/account";
import { reconcileAccount } from "@/lib/api/accounts";
import { formatIDR } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ReconcileModalProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

export function ReconcileModal({ account, open, onOpenChange, onDataChanged }: ReconcileModalProps) {
  const queryClient = useQueryClient();
  const [actualBalanceStr, setActualBalanceStr] = useState("");
  const [note, setNote] = useState("Penyesuaian saldo riil");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ accountId, actualBalance, note }: { accountId: number; actualBalance: number; note: string }) =>
      reconcileAccount(accountId, { actual_balance: actualBalance, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onDataChanged?.();
      onOpenChange(false);
      setActualBalanceStr("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal melakukan rekonsiliasi");
    },
  });

  if (!account) return null;

  const currentBalance = Number(account.balance) || 0;
  const parsedActual = parseInt(actualBalanceStr.replace(/[^0-9-]/g, ""), 10) || 0;
  const difference = parsedActual - currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualBalanceStr.trim() === "") {
      setError("Masukkan saldo riil rekening");
      return;
    }
    mutation.mutate({
      accountId: account.id,
      actualBalance: parsedActual,
      note: note.trim() || "Penyesuaian saldo riil",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          Sinkronisasi Saldo — {account.name}
        </DialogTitle>
        <DialogDescription>
          Sesuaikan saldo aplikasi dengan saldo riil pada mobile banking/e-wallet Anda.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Ledger Balance */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
          <span className="text-xs text-slate-400">Saldo Tercatat Saat Ini (Ledger)</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {formatIDR(currentBalance)}
          </div>
        </div>

        {/* Input Actual Balance */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Saldo Riil di Rekening / Aplikasi *
          </label>
          <Input
            type="number"
            placeholder="Contoh: 1500000"
            value={actualBalanceStr}
            onChange={(e) => setActualBalanceStr(e.target.value)}
            className="text-base font-bold tabular-nums"
            required
            autoFocus
          />
        </div>

        {/* Difference preview */}
        {actualBalanceStr.trim() !== "" && (
          <div className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Selisih Penyesuaian:</span>
            <span
              className={`font-bold tabular-nums ${
                difference > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : difference < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {difference > 0 ? `+${formatIDR(difference)}` : formatIDR(difference)}
            </span>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Catatan Rekonsiliasi
          </label>
          <Input
            placeholder="Alasan penyesuaian saldo"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
            Terapkan Penyesuaian
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
