"use client";

import React from "react";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { ParseStatusBadge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ShoppingBag, Eye } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onSelectTransaction: (tx: Transaction) => void;
  isLoading?: boolean;
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
  onSelectTransaction,
  isLoading,
}: TransactionTableProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const getAccountLabel = (tx: Transaction) => {
    if (tx.type === "transfer") {
      const src = tx.source_account_id ? accountMap.get(tx.source_account_id) : "Unknown";
      const dst = tx.destination_account_id ? accountMap.get(tx.destination_account_id) : "Unknown";
      return `${src} → ${dst}`;
    }
    if (tx.type === "income") {
      return tx.destination_account_id ? accountMap.get(tx.destination_account_id) : "Unknown";
    }
    return tx.source_account_id ? accountMap.get(tx.source_account_id) : "Unknown";
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case "expense":
        return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
      case "transfer":
        return <ArrowLeftRight className="w-4 h-4 text-purple-500" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 mx-auto flex items-center justify-center text-slate-400 mb-3">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Tidak ada transaksi ditemukan
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Coba ubah kata kunci pencarian atau bersihkan filter yang aktif.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Deskripsi / Merchant</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4">Rekening</th>
              <th className="py-3.5 px-4">Waktu</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Nominal</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {transactions.map((tx) => {
              const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : "-";
              const accountLabel = getAccountLabel(tx);

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shrink-0">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {tx.merchant || tx.description || "Transaksi"}
                        </div>
                        {tx.merchant && tx.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {categoryName}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {accountLabel}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {formatDate(tx.occurred_at)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ParseStatusBadge status={tx.parse_status} />
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div
                      className={`font-bold tabular-nums text-sm ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : tx.type === "expense"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {tx.type === "income"
                        ? `+${formatIDR(tx.amount)}`
                        : tx.type === "expense"
                        ? `-${formatIDR(tx.amount)}`
                        : formatIDR(tx.amount)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(tx);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Lihat rincian"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Cards View */}
      <div className="md:hidden space-y-2.5">
        {transactions.map((tx) => {
          const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : null;
          const accountLabel = getAccountLabel(tx);

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {tx.merchant || tx.description || "Transaksi"}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {accountLabel} {categoryName ? `• ${categoryName}` : ""}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-sm tabular-nums ${
                      tx.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : tx.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {tx.type === "income"
                      ? `+${formatIDR(tx.amount)}`
                      : tx.type === "expense"
                      ? `-${formatIDR(tx.amount)}`
                      : formatIDR(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(tx.occurred_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
