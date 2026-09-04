"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { TransactionType } from "@/types/transaction";
import { createTransaction } from "@/lib/api/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  onDataChanged?: () => void;
}

export function CreateTransactionModal({
  open,
  onOpenChange,
  accounts,
  categories,
  onDataChanged,
}: CreateTransactionModalProps) {
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>("expense");
  const [amountStr, setAmountStr] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<string>("");
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onDataChanged?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal menambahkan transaksi");
    },
  });

  const resetForm = () => {
    setAmountStr("");
    setDescription("");
    setError(null);
    setSourceAccountId("");
    setDestinationAccountId("");
    setCategoryId("");
    setOccurredAt(new Date().toISOString().slice(0, 16));
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    if (!amount || amount <= 0) {
      setError("Jumlah uang harus lebih dari 0");
      return;
    }

    if (type === "expense") {
      if (!sourceAccountId) {
        setError("Pilih rekening sumber");
        return;
      }
      if (!categoryId) {
        setError("Pilih kategori pengeluaran");
        return;
      }
    } else if (type === "income") {
      if (!destinationAccountId) {
        setError("Pilih rekening tujuan");
        return;
      }
      if (!categoryId) {
        setError("Pilih kategori pemasukan");
        return;
      }
    } else if (type === "transfer") {
      if (!sourceAccountId || !destinationAccountId) {
        setError("Pilih rekening sumber dan rekening tujuan");
        return;
      }
      if (sourceAccountId === destinationAccountId) {
        setError("Rekening sumber dan tujuan tidak boleh sama");
        return;
      }
    }

    const isoOccurredAt = new Date(occurredAt).toISOString();

    mutation.mutate({
      type,
      amount,
      source_account_id:
        type === "expense" || type === "transfer" ? Number(sourceAccountId) : undefined,
      destination_account_id:
        type === "income" || type === "transfer" ? Number(destinationAccountId) : undefined,
      category_id: type !== "transfer" ? Number(categoryId) : undefined,
      description: description.trim() || undefined,
      occurred_at: isoOccurredAt,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>Catat Transaksi Manual</DialogTitle>
        <DialogDescription>
          Tambahkan transaksi pemasukan, pengeluaran, atau transfer dana antar rekening.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                type === t
                  ? t === "expense"
                    ? "bg-rose-600 text-white shadow-xs"
                    : t === "income"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Nominal (Rp) *
          </label>
          <Input
            type="number"
            placeholder="Contoh: 50000"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="text-base font-bold tabular-nums"
            required
          />
        </div>

        {/* Accounts Selection */}
        {(type === "expense" || type === "transfer") && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Rekening Asal / Sumber *
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              required
            >
              <option value="">-- Pilih Rekening Sumber --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.provider || a.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {(type === "income" || type === "transfer") && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Rekening Tujuan *
            </label>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              required
            >
              <option value="">-- Pilih Rekening Tujuan --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.provider || a.type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category (not for transfer) */}
        {type !== "transfer" && (
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Kategori *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description / Merchant */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Deskripsi / Merchant (Opsional)
          </label>
          <Input
            placeholder="Contoh: Kopi Kenangan, Beli Token Listrik, Gaji"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Date / Time */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Waktu Transaksi *
          </label>
          <Input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
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
            Simpan Transaksi
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
