"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionTypeBadge, ParseStatusBadge, Badge } from "@/components/ui/badge";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { formatIDR, formatDateTime } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Edit3, Check, Landmark, Calendar, Sparkles, Tag, ArrowRight } from "lucide-react";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  onDataChanged?: () => void;
}

function EditTransactionForm({
  transaction,
  categories,
  onCancel,
  onSuccess,
  onDataChanged,
}: {
  transaction: Transaction;
  categories: Category[];
  onCancel: () => void;
  onSuccess: () => void;
  onDataChanged?: () => void;
}) {
  const queryClient = useQueryClient();
  const [editCategoryId, setEditCategoryId] = useState<string>(
    transaction.category_id ? String(transaction.category_id) : ""
  );
  const [editMerchant, setEditMerchant] = useState<string>(transaction.merchant || "");
  const [editDescription, setEditDescription] = useState<string>(transaction.description || "");
  const [learnRule, setLearnRule] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; input: Parameters<typeof updateTransaction>[1] }) =>
      updateTransaction(data.id, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onDataChanged?.();
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal memperbarui transaksi");
    },
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    updateMutation.mutate({
      id: transaction.id,
      input: {
        category_id: editCategoryId ? Number(editCategoryId) : null,
        merchant: editMerchant.trim() || null,
        description: editDescription.trim() || null,
        learn_rule: learnRule,
      },
    });
  };

  const filteredCategories = categories.filter((c) => c.type === transaction.type);

  return (
    <form onSubmit={handleSaveEdit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Nama Merchant / Toko
        </label>
        <Input
          value={editMerchant}
          onChange={(e) => setEditMerchant(e.target.value)}
          placeholder="Contoh: Shopee, Kopi Kenangan, Tokopedia"
        />
      </div>

      {transaction.type !== "transfer" && (
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Kategori Transaksi
          </label>
          <select
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
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

      <div>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Catatan / Deskripsi Tambahan
        </label>
        <Input
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Catatan opsional..."
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={learnRule}
          onChange={(e) => setLearnRule(e.target.checked)}
          className="rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
        />
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Simpan sebagai aturan kategori otomatis untuk merchant ini di masa depan</span>
        </div>
      </label>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={updateMutation.isPending}
        >
          Batal
        </Button>
        <Button type="submit" variant="emerald" isLoading={updateMutation.isPending}>
          <Check className="w-4 h-4 mr-1" />
          <span>Simpan Koreksi</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
  accounts,
  categories,
  onDataChanged,
}: TransactionDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onDataChanged?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal menghapus transaksi");
    },
  });

  if (!transaction) return null;

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const sourceName = transaction.source_account_id
    ? accountMap.get(transaction.source_account_id)
    : "-";
  const destName = transaction.destination_account_id
    ? accountMap.get(transaction.destination_account_id)
    : "-";
  const categoryName = transaction.category_id ? categoryMap.get(transaction.category_id) : "-";

  const handleDelete = () => {
    deleteMutation.mutate(transaction.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle onClose={() => onOpenChange(false)}>
            {isEditing ? "Koreksi Transaksi" : "Detail Transaksi"}
          </DialogTitle>
        </div>
        <DialogDescription>
          ID Transaksi #{transaction.id} • Sumber: {transaction.source}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {isEditing ? (
        <EditTransactionForm
          key={transaction.id}
          transaction={transaction}
          categories={categories}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            onOpenChange(false);
          }}
          onDataChanged={onDataChanged}
        />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <TransactionTypeBadge type={transaction.type} />
              <ParseStatusBadge status={transaction.parse_status} />
            </div>
            <div
              className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                transaction.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : transaction.type === "expense"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {transaction.type === "income"
                ? `+${formatIDR(transaction.amount)}`
                : transaction.type === "expense"
                ? `-${formatIDR(transaction.amount)}`
                : formatIDR(transaction.amount)}
            </div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              {transaction.merchant || transaction.description || "Tanpa Keterangan"}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Rekening Asal</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{sourceName}</span>
            </div>

            {transaction.type === "transfer" && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Rekening Tujuan</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{destName}</span>
              </div>
            )}

            {transaction.type !== "transfer" && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Kategori</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{categoryName}</span>
              </div>
            )}

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Waktu Kejadian</span>
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDateTime(transaction.occurred_at)}
              </span>
            </div>

            {transaction.confidence != null && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Confidence AI</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {(transaction.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {transaction.raw_notification_id && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ref Notifikasi</span>
                <Badge variant="outline">Notif #{transaction.raw_notification_id}</Badge>
              </div>
            )}
          </div>

          {confirmDelete && (
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 space-y-2">
              <p className="font-medium">
                Apakah Anda yakin ingin menghapus transaksi ini? Saldo rekening akan disesuaikan kembali.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                  className="h-7 text-xs"
                >
                  Ya, Hapus
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 text-xs"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {!confirmDelete ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs"
                disabled={transaction.source === "reconcile"}
                title={transaction.source === "reconcile" ? "Transaksi penyesuaian tidak dapat dihapus langsung" : undefined}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Hapus</span>
              </Button>
            ) : <div />}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              <span>Edit / Koreksi</span>
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
