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

      {/* Date Range Filter Section */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto">
            {PRESETS.map((p) => {
              const isActive = filters.datePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetSelect(p.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-[#161e31] text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Dari:</span>
              <input
                type="date"
                max={todayMax}
                value={filters.startDate || ""}
                onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate)}
                className="px-2.5 py-1 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              />
            </div>

            <span className="text-slate-400 text-xs">s/d</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Sampai:</span>
              <input
                type="date"
                max={todayMax}
                min={filters.startDate || undefined}
                value={filters.endDate || ""}
                onChange={(e) => handleCustomDateChange(filters.startDate, e.target.value)}
                className="px-2.5 py-1 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {(filters.startDate || filters.endDate) && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>Rentang Aktif:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
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
