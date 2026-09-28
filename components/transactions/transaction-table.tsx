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
        return <ArrowDownLeft size={20} className="income-text" />;
      case "expense":
        return <ArrowUpRight size={20} />;
      case "transfer":
        return <ArrowLeftRight size={20} />;
      default:
        return <ShoppingBag size={20} />;
    }
  };

  if (isLoading) {
    return (
      <div className="surface p-4 space-y-3" role="status" aria-label="Memuat transaksi">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="activity-skeleton skeleton-block" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="surface p-12 text-center">
        <div className="row-icon mx-auto mb-3">
          <ShoppingBag size={22} />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          Tidak ada transaksi ditemukan
        </h3>
        <p className="text-xs text-[var(--app-muted)] mt-1 max-w-sm mx-auto">
          Coba ubah kata kunci pencarian atau sesuaikan filter yang aktif.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Desktop Table View */}
      <div className="hidden md:block surface activity-table-surface">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Deskripsi / Merchant</th>
              <th>Kategori</th>
              <th>Rekening</th>
              <th>Waktu</th>
              <th>Status</th>
              <th className="text-right">Nominal</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : "-";
              const accountLabel = getAccountLabel(tx);

              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="cursor-pointer group"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <span className={`row-icon ${tx.type === "income" ? "income-text" : ""}`}>
                        {getTransactionIcon(tx.type)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--foreground)] truncate max-w-[220px]">
                          {tx.merchant || tx.description || "Transaksi"}
                        </div>
                        {tx.merchant && tx.description && (
                          <div className="text-[11px] text-[var(--app-muted)] truncate max-w-[220px]">
                            {tx.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="text-[var(--foreground)] font-medium">
                    {categoryName}
                  </td>

                  <td className="text-[var(--app-muted)]">
                    {accountLabel}
                  </td>

                  <td className="text-[var(--app-muted)] whitespace-nowrap">
                    {formatDate(tx.occurred_at)}
                  </td>

                  <td className="whitespace-nowrap">
                    <ParseStatusBadge status={tx.parse_status} />
                  </td>

                  <td className="text-right whitespace-nowrap">
                    <div
                      className={`font-semibold tabular-nums text-sm ${
                        tx.type === "income"
                          ? "income-text"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {tx.type === "income"
                        ? `+${formatIDR(tx.amount)}`
                        : tx.type === "expense"
                        ? `-${formatIDR(tx.amount)}`
                        : formatIDR(tx.amount)}
                    </div>
                  </td>

                  <td className="text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(tx);
                      }}
                      className="p-1.5 rounded-lg text-[var(--app-muted)] hover:text-[var(--app-blue)] transition-colors cursor-pointer"
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

      {/* 2. Mobile Activity List View */}
      <div className="md:hidden surface activity-list">
        {transactions.map((tx) => {
          const categoryName = tx.category_id ? categoryMap.get(tx.category_id) : null;
          const accountLabel = getAccountLabel(tx);

          return (
            <article
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="activity-row cursor-pointer"
            >
              <span className={`row-icon ${tx.type === "income" ? "income-text" : ""}`}>
                {getTransactionIcon(tx.type)}
              </span>

              <div className="activity-description">
                <strong>{tx.merchant || tx.description || "Transaksi"}</strong>
                <span>
                  {accountLabel} {categoryName ? `· ${categoryName}` : ""} · {formatDate(tx.occurred_at)}
                  {tx.parse_status === "MANUAL" && (
                    <span className="review-note"> · Perlu dicek</span>
                  )}
                </span>
              </div>

              <strong className={`activity-amount ${tx.type === "income" ? "income-text" : ""}`}>
                {tx.type === "income"
                  ? `+${formatIDR(tx.amount)}`
                  : tx.type === "expense"
                  ? `-${formatIDR(tx.amount)}`
                  : formatIDR(tx.amount)}
              </strong>
            </article>
          );
        })}
      </div>
    </div>
  );
}
