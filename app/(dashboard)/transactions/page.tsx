"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, AddAction, LoadError } from "@/components/ui/finance";
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
import type { Transaction } from "@/types/transaction";

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
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    data: transactionsData,
    isPending: transactionsPending,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  const {
    data: accountsData,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const {
    data: categoriesData,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const transactions = useMemo(() => transactionsData ?? [], [transactionsData]);
  const accounts = accountsData ?? [];
  const categories = categoriesData ?? [];
  const txLoading = transactionsPending;

  const loadData = useCallback(() => {
    void refetchTransactions();
    void refetchAccounts();
    void refetchCategories();
  }, [refetchTransactions, refetchAccounts, refetchCategories]);

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
        if (
          tx.source_account_id !== targetId &&
          tx.destination_account_id !== targetId
        ) {
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
      if (
        !isDateInDateRange(tx.occurred_at, filters.startDate, filters.endDate)
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE),
  );
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, page]);

  return (
    <div className="finance-page transaction-page">
      {/* Header */}
      <PageHeader
        title="Aktivitas"
        description={
          txLoading
            ? "Memuat pergerakan dana."
            : `Menampilkan ${filteredTransactions.length} dari ${transactions.length} transaksi.`
        }
        actions={
          <AddAction onClick={() => setCreateModalOpen(true)}>
            Catat transaksi
          </AddAction>
        }
      />

      {(transactionsError || accountsError || categoriesError) && (
        <LoadError onRetry={loadData}>
          Sebagian data aktivitas belum berhasil dimuat. Coba muat ulang.
        </LoadError>
      )}

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
      {!transactionsError && (
        <TransactionTable
          transactions={paginatedTransactions}
          accounts={accounts}
          categories={categories}
          onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          isLoading={txLoading}
        />
      )}

      {/* Pagination controls */}
      {filteredTransactions.length > ITEMS_PER_PAGE && (
        <div className="pagination-bar">
          <span>
            Halaman {page} dari {totalPages} ({filteredTransactions.length}{" "}
            total)
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
