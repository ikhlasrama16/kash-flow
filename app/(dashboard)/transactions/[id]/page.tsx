"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Landmark, Calendar, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TransactionTypeBadge, ParseStatusBadge, Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { getTransaction } from "@/lib/api/transactions";
import { getAccounts } from "@/lib/api/accounts";
import { getCategories } from "@/lib/api/categories";
import { formatIDR, formatDateTime } from "@/lib/utils";

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const txId = Number(id);

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ["transaction", txId],
    queryFn: () => getTransaction(txId),
    enabled: !isNaN(txId),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-8">
        <div className="h-8 w-40 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaksi Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Transaksi dengan ID #{id} tidak ditemukan di database.
        </p>
        <Link href="/transactions">
          <Button variant="emerald">Kembali ke Daftar Transaksi</Button>
        </Link>
      </div>
    );
  }

  const sourceName = transaction.source_account_id
    ? accountMap.get(transaction.source_account_id)
    : "-";
  const destName = transaction.destination_account_id
    ? accountMap.get(transaction.destination_account_id)
    : "-";
  const categoryName = transaction.category_id ? categoryMap.get(transaction.category_id) : "-";

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Transaksi</span>
          </button>
        </div>

        <Card className="border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TransactionTypeBadge type={transaction.type} />
              <ParseStatusBadge status={transaction.parse_status} />
            </div>
            <div
              className={`text-4xl font-extrabold tracking-tight tabular-nums ${
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
            <CardTitle className="text-lg mt-2">
              {transaction.merchant || transaction.description || "Transaksi"}
            </CardTitle>
            <CardDescription>
              ID Transaksi #{transaction.id} • Sumber: {transaction.source}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  <span>Rekening Asal</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{sourceName}</span>
              </div>

              {transaction.type === "transfer" && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    <span>Rekening Tujuan</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{destName}</span>
                </div>
              )}

              {transaction.type !== "transfer" && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Kategori</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{categoryName}</span>
                </div>
              )}

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Waktu Kejadian</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDateTime(transaction.occurred_at)}
                </span>
              </div>

              {transaction.confidence != null && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Confidence Score</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {(transaction.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {transaction.raw_notification_id && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tautan Notifikasi</span>
                  <Link href="/notifications">
                    <Badge variant="outline" className="hover:border-emerald-500 cursor-pointer">
                      Notifikasi #{transaction.raw_notification_id}
                    </Badge>
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Link href="/transactions">
                <Button variant="outline" size="sm">Kembali ke Daftar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
