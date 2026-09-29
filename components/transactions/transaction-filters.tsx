"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Account } from "@/types/account";
import type { Category } from "@/types/category";
import type { TransactionType } from "@/types/transaction";
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
  { key: "all", label: "Semua waktu" },
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "this_week", label: "Minggu ini" },
  { key: "this_month", label: "Bulan ini" },
  { key: "custom", label: "Pilih tanggal" },
];

const STATUS_LABELS: Record<string, string> = {
  AUTO: "Otomatis",
  RULE: "Aturan",
  MANUAL: "Manual",
  NEEDS_REVIEW: "Perlu ditinjau",
  REPROCESS: "Diproses ulang",
};

export function TransactionFilters({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const todayMax = getJakartaDateString();
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(filters.accountId || filters.categoryId || filters.parseStatus),
  );
  const patch = (updates: Partial<TransactionFilterState>) =>
    onFilterChange({ ...filters, ...updates });

  const reset = () =>
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

  const advancedCount =
    Number(Boolean(filters.accountId)) +
    Number(Boolean(filters.categoryId)) +
    Number(Boolean(filters.parseStatus));
  const activeCount =
    Number(Boolean(filters.search.trim())) +
    Number(filters.type !== "all") +
    Number(filters.datePreset !== "all") +
    advancedCount;

  const chips = useMemo(() => {
    const result: { label: string; clear: Partial<TransactionFilterState> }[] =
      [];
    if (filters.search.trim())
      result.push({
        label: `Cari: ${filters.search.trim()}`,
        clear: { search: "" },
      });
    if (filters.type !== "all")
      result.push({
        label:
          filters.type === "expense"
            ? "Pengeluaran"
            : filters.type === "income"
              ? "Pemasukan"
              : "Transfer",
        clear: { type: "all" },
      });
    if (filters.datePreset !== "all") {
      const label =
        filters.datePreset === "custom"
          ? `${filters.startDate ? formatIDDate(filters.startDate) : "Awal"} sampai ${filters.endDate ? formatIDDate(filters.endDate) : "Sekarang"}`
          : (PRESETS.find((preset) => preset.key === filters.datePreset)
              ?.label ?? "Rentang tanggal");
      result.push({
        label,
        clear: { datePreset: "all", startDate: "", endDate: "" },
      });
    }
    if (filters.accountId) {
      const account = accounts.find(
        (item) => String(item.id) === filters.accountId,
      );
      result.push({
        label: `Rekening: ${account?.name ?? "Dipilih"}`,
        clear: { accountId: "" },
      });
    }
    if (filters.categoryId) {
      const category = categories.find(
        (item) => String(item.id) === filters.categoryId,
      );
      result.push({
        label: `Kategori: ${category?.name ?? "Dipilih"}`,
        clear: { categoryId: "" },
      });
    }
    if (filters.parseStatus) {
      result.push({
        label: `Status: ${STATUS_LABELS[filters.parseStatus] ?? filters.parseStatus}`,
        clear: { parseStatus: "" },
      });
    }
    return result;
  }, [filters, accounts, categories]);

  const handlePresetSelect = (preset: DatePresetKey) => {
    if (preset === "custom") {
      patch({ datePreset: preset });
      return;
    }
    const { startDate, endDate } = getPresetDates(preset);
    patch({ datePreset: preset, startDate, endDate });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    const orderedStart = start && end && start > end ? end : start;
    patch({ datePreset: "custom", startDate: orderedStart, endDate: end });
  };

  return (
    <section
      className="surface transaction-filters-surface"
      aria-label="Filter transaksi"
    >
      <div className="transaction-filter-primary">
        <label className="transaction-search">
          <Search aria-hidden="true" size={18} />
          <Input
            type="search"
            aria-label="Cari transaksi"
            placeholder="Cari transaksi, merchant, atau deskripsi"
            value={filters.search}
            onChange={(event) => patch({ search: event.target.value })}
          />
          {filters.search && (
            <button
              className="filter-icon-button"
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => patch({ search: "" })}
            >
              <X size={17} />
            </button>
          )}
        </label>
        <div
          className="segmented-control transaction-type-control"
          role="group"
          aria-label="Jenis transaksi"
        >
          {(["all", "expense", "income", "transfer"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={filters.type === type}
              onClick={() => patch({ type })}
            >
              {type === "all"
                ? "Semua"
                : type === "expense"
                  ? "Pengeluaran"
                  : type === "income"
                    ? "Pemasukan"
                    : "Transfer"}
            </button>
          ))}
        </div>
      </div>

      <div className="transaction-filter-period">
        <div className="transaction-filter-heading">
          <span>Periode transaksi</span>
          {filters.datePreset === "custom" &&
            (filters.startDate || filters.endDate) && (
              <span className="transaction-custom-range">
                <Calendar size={15} aria-hidden="true" />
                {filters.startDate
                  ? formatIDDate(filters.startDate)
                  : "Awal"}{" "}
                sampai{" "}
                {filters.endDate ? formatIDDate(filters.endDate) : "Sekarang"}
              </span>
            )}
        </div>
        <div className="transaction-period-row">
          <div
            className="segmented-control transaction-date-presets"
            role="group"
            aria-label="Periode cepat"
          >
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filters.datePreset === key}
                onClick={() => handlePresetSelect(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {filters.datePreset === "custom" && (
            <div className="transaction-date-fields">
              <label>
                <span>Dari</span>
                <input
                  type="date"
                  aria-label="Tanggal mulai"
                  max={filters.endDate || todayMax}
                  value={filters.startDate}
                  onChange={(event) =>
                    handleCustomDateChange(event.target.value, filters.endDate)
                  }
                />
              </label>
              <label>
                <span>Sampai</span>
                <input
                  type="date"
                  aria-label="Tanggal akhir"
                  min={filters.startDate || undefined}
                  max={todayMax}
                  value={filters.endDate}
                  onChange={(event) =>
                    handleCustomDateChange(
                      filters.startDate,
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <details
        className="transaction-advanced-filter"
        open={advancedOpen}
        onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Filter lainnya</span>
          {advancedCount > 0 && (
            <span className="filter-count">{advancedCount} dipilih</span>
          )}
          <ChevronDown
            className="filter-advanced-chevron"
            size={17}
            aria-hidden="true"
          />
        </summary>
        <div className="transaction-filter-selects">
          <label>
            <span>Rekening</span>
            <select
              aria-label="Filter berdasarkan rekening"
              value={filters.accountId}
              onChange={(event) => patch({ accountId: event.target.value })}
              className="filter-select"
            >
              <option value="">Semua rekening</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.provider || account.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Kategori</span>
            <select
              aria-label="Filter berdasarkan kategori"
              value={filters.categoryId}
              onChange={(event) => patch({ categoryId: event.target.value })}
              className="filter-select"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} (
                  {category.type === "income" ? "pemasukan" : "pengeluaran"})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status pencatatan</span>
            <select
              aria-label="Filter berdasarkan status pencatatan"
              value={filters.parseStatus}
              onChange={(event) => patch({ parseStatus: event.target.value })}
              className="filter-select"
            >
              <option value="">Semua status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      {activeCount > 0 && (
        <div
          className="transaction-active-filters"
          aria-label={`${activeCount} filter aktif`}
        >
          <div className="transaction-filter-chips">
            {chips.map((chip) => (
              <button
                type="button"
                className="transaction-filter-chip"
                key={chip.label}
                aria-label={`Hapus filter ${chip.label}`}
                onClick={() => patch(chip.clear)}
              >
                <span>{chip.label}</span>
                <X size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
          <button className="filter-reset-btn" type="button" onClick={reset}>
            Hapus semua
          </button>
        </div>
      )}
    </section>
  );
}
