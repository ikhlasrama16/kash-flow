"use client";

import React, { useState, useMemo } from "react";
import { Plus, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/react-bits/page-transition";
import {
  TransactionFilters,
  TransactionFilterState,
} from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal";
import { CreateTransactionModal } from "@/components/dashboard/create-transaction-modal";
import { getTransactions } from "@/lib/api/transactions";
import { getAccounts } from "@/lib/api/accounts";
import { getCategories } from "@/lib/api/categories";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/account";
import { Category } from "@/types/category";

const ITEMS_PER_PAGE = 15;

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "",
    type: "all",
    accountId: "",
    categoryId: "",
    parseStatus: "",
  });

  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Native state with immediate useEffect fetch
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const loadData = React.useCallback(() => {
    setTxLoading(true);
    Promise.all([
      getTransactions().catch((err) => {
        console.error("Failed to load transactions:", err);
        return [] as Transaction[];
      }),
      getAccounts().catch((err) => {
        console.error("Failed to load accounts:", err);
        return [] as Account[];
      }),
      getCategories().catch((err) => {
        console.error("Failed to load categories:", err);
        return [] as Category[];
      }),
    ]).then(([txs, accs, cats]) => {
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setTxLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const merchantMatch = tx.merchant?.toLowerCase().includes(query);
        const descMatch = tx.description?.toLowerCase().includes(query);
        if (!merchantMatch && !descMatch) return false;
      }

      // Type
      if (filters.type !== "all" && tx.type !== filters.type) {
        return false;
      }

      // Account
      if (filters.accountId) {
        const targetId = Number(filters.accountId);
        if (tx.source_account_id !== targetId && tx.destination_account_id !== targetId) {
          return false;
        }
      }

      // Category
      if (filters.categoryId) {
        const targetId = Number(filters.categoryId);
        if (tx.category_id !== targetId) {
          return false;
        }
      }

      // Parse status
      if (filters.parseStatus && tx.parse_status !== filters.parseStatus) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, page]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Daftar Transaksi
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Menampilkan {filteredTransactions.length} riwayat pergerakan dana
            </p>
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs font-semibold shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Transaksi</span>
          </Button>
        </div>

        {/* Filter controls */}
        <TransactionFilters
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1); // reset to first page on filter change
          }}
          accounts={accounts}
          categories={categories}
        />

        {/* Table & Cards */}
        <TransactionTable
          transactions={paginatedTransactions}
          accounts={accounts}
          categories={categories}
          onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          isLoading={txLoading}
        />

        {/* Pagination controls */}
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500">
            <span>
              Halaman {page} dari {totalPages} ({filteredTransactions.length} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2.5"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <TransactionDetailModal
          transaction={selectedTransaction}
          open={Boolean(selectedTransaction)}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
          accounts={accounts}
          categories={categories}
          onDataChanged={loadData}
        />

        {/* Create Modal */}
        <CreateTransactionModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          accounts={accounts}
          categories={categories}
          onDataChanged={loadData}
        />
      </div>
    </PageTransition>
  );
}
