"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, AddAction } from "@/components/ui/finance";
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
import { isDateInDateRange } from "@/lib/utils/date-filter";
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
    startDate: "",
    endDate: "",
    datePreset: "all",
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

      // Date Range
      if (!isDateInDateRange(tx.occurred_at, filters.startDate, filters.endDate)) {
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
    <div className="finance-page">
      {/* Header */}
      <PageHeader
        title="Aktivitas"
        description={`Menampilkan ${filteredTransactions.length} riwayat pergerakan dana.`}
        actions={
          <AddAction onClick={() => setCreateModalOpen(true)}>
            Catat transaksi
          </AddAction>
        }
      />

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
        <div className="pagination-bar">
          <span>
            Halaman {page} dari {totalPages} ({filteredTransactions.length} total)
          </span>
          <div className="pagination-actions">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="pagination-btn"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="pagination-btn"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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
  );
}
