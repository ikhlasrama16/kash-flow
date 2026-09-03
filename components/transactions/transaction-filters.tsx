"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { TransactionType } from "@/types/transaction";

export interface TransactionFilterState {
  search: string;
  type: TransactionType | "all";
  accountId: string;
  categoryId: string;
  parseStatus: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilterState;
  onFilterChange: (filters: TransactionFilterState) => void;
  accounts: Account[];
  categories: Category[];
}

export function TransactionFilters({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const handleReset = () => {
    onFilterChange({
      search: "",
      type: "all",
      accountId: "",
      categoryId: "",
      parseStatus: "",
    });
  };

  const isFiltered =
    filters.search !== "" ||
    filters.type !== "all" ||
    filters.accountId !== "" ||
    filters.categoryId !== "" ||
    filters.parseStatus !== "";

  return (
    <div className="space-y-3 bg-white dark:bg-[#0e1422] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
      {/* Search and Type Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari merchant, toko, deskripsi..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10 h-10"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 shrink-0 overflow-x-auto">
          {(["all", "expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFilterChange({ ...filters, type: t })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                filters.type === t
                  ? "bg-white dark:bg-[#161e31] text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t === "all" ? "Semua" : t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters (Account, Category, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Account Filter */}
        <select
          value={filters.accountId}
          onChange={(e) => onFilterChange({ ...filters, accountId: e.target.value })}
          className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Semua Rekening</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.provider || a.type})
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={filters.categoryId}
          onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
          className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.parseStatus}
          onChange={(e) => onFilterChange({ ...filters, parseStatus: e.target.value })}
          className="h-9 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Semua Status Parser</option>
          <option value="AUTO">AUTO</option>
          <option value="RULE">RULE</option>
          <option value="MANUAL">MANUAL</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
          <option value="REPROCESS">REPROCESS</option>
        </select>
      </div>

      {/* Reset filter badge */}
      {isFiltered && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span>Filter diterapkan</span>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}
    </div>
  );
}
