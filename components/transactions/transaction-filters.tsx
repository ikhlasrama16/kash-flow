"use client";

import React from "react";
import { Search, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { TransactionType } from "@/types/transaction";
import {
  DatePresetKey,
  getJakartaDateString,
  getPresetDates,
  formatIDDate,
} from "@/lib/utils/date-filter";

export interface TransactionFilterState {
  search: string;
  type: TransactionType | "all";
  accountId: string;
  categoryId: string;
  parseStatus: string;
  startDate: string;
  endDate: string;
  datePreset: DatePresetKey;
}

interface TransactionFiltersProps {
  filters: TransactionFilterState;
  onFilterChange: (filters: TransactionFilterState) => void;
  accounts: Account[];
  categories: Category[];
}

const PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: "all", label: "Semua Waktu" },
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "this_week", label: "Minggu Ini" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "custom", label: "Kustom" },
];

export function TransactionFilters({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const todayMax = getJakartaDateString();

  const handleReset = () => {
    onFilterChange({
      search: "",
      type: "all",
      accountId: "",
      categoryId: "",
      parseStatus: "",
      startDate: "",
      endDate: "",
      datePreset: "all",
    });
  };

  const handlePresetSelect = (preset: DatePresetKey) => {
    if (preset === "custom") {
      onFilterChange({
        ...filters,
        datePreset: "custom",
      });
      return;
    }
    const { startDate, endDate } = getPresetDates(preset);
    onFilterChange({
      ...filters,
      datePreset: preset,
      startDate,
      endDate,
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    let newStart = start;
    let newEnd = end;
    if (newStart && newEnd && newStart > newEnd) {
      newStart = newEnd;
    }
    onFilterChange({
      ...filters,
      datePreset: "custom",
      startDate: newStart,
      endDate: newEnd,
    });
  };

  const isFiltered =
    filters.search !== "" ||
    filters.type !== "all" ||
    filters.accountId !== "" ||
    filters.categoryId !== "" ||
    filters.parseStatus !== "" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.datePreset !== "all";

  return (
    <div className="surface transaction-filters-surface">
      {/* Search and Type Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input
            type="text"
            placeholder="Cari merchant, toko, deskripsi..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="filter-search-input"
          />
        </div>

        {/* Type pills */}
        <div className="segmented-control shrink-0" role="group" aria-label="Tipe transaksi">
          {(["all", "expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={filters.type === t}
              onClick={() => onFilterChange({ ...filters, type: t })}
            >
              {t === "all" ? "Semua" : t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter Section */}
      <div className="pt-2 border-t border-[var(--app-line)] space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Preset Buttons */}
          <div className="segmented-control shrink-0 max-w-full overflow-x-auto" role="group" aria-label="Rentang tanggal">
            {PRESETS.map((p) => {
              const isActive = filters.datePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handlePresetSelect(p.key)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[var(--app-muted)] font-medium">Dari:</span>
              <input
                type="date"
                max={todayMax}
                value={filters.startDate || ""}
                onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate)}
                className="filter-date-input"
              />
            </div>

            <span className="text-[var(--app-muted)] text-xs">s/d</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[var(--app-muted)] font-medium">Sampai:</span>
              <input
                type="date"
                max={todayMax}
                min={filters.startDate || undefined}
                value={filters.endDate || ""}
                onChange={(e) => handleCustomDateChange(filters.startDate, e.target.value)}
                className="filter-date-input"
              />
            </div>
          </div>
        </div>

        {(filters.startDate || filters.endDate) && (
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--app-muted)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--app-blue)]" />
            <span>Rentang Aktif:</span>
            <span className="font-semibold text-[var(--foreground)]">
              {filters.startDate ? formatIDDate(filters.startDate) : "Awal"} — {filters.endDate ? formatIDDate(filters.endDate) : "Sekarang"}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown Filters (Account, Category, Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Account Filter */}
        <select
          value={filters.accountId}
          onChange={(e) => onFilterChange({ ...filters, accountId: e.target.value })}
          className="filter-select"
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
          className="filter-select"
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
          className="filter-select"
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
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--app-muted)]">
          <span>Filter diterapkan</span>
          <button
            type="button"
            onClick={handleReset}
            className="filter-reset-btn"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}
    </div>
  );
}
