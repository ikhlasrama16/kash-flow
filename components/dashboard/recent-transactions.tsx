"use client";

import React from "react";
import Link from "next/link";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TransactionTypeBadge, ParseStatusBadge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { ArrowRight, ShoppingBag, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions,
  accounts,
  categories,
  isLoading,
}: RecentTransactionsProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

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

  return (
    <Card className="border-slate-200/80 dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Aktivitas Transaksi Terakhir</CardTitle>
          <CardDescription>Transaksi terdeteksi dari notifikasi atau manual</CardDescription>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Belum ada transaksi
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Saat ada aktivitas keuangan terdeteksi, daftar transaksi akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {transactions.slice(0, 7).map((tx) => {
              const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : null;
              const accountLabel = getAccountLabel(tx);

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {tx.merchant || tx.description || "Transaksi"}
                        </span>
                        <ParseStatusBadge status={tx.parse_status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{accountLabel}</span>
                        {categoryName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{categoryName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(tx.occurred_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Badge */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-bold tabular-nums ${
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
                    <div className="mt-0.5">
                      <TransactionTypeBadge type={tx.type} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
