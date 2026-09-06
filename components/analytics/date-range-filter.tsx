"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { ComparisonMode } from "@/types/report";

export type PresetKey = "today" | "yesterday" | "this_week" | "this_month" | "custom";

export interface DateRangeState {
  preset: PresetKey;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  comparison: ComparisonMode;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
}

export function getJakartaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatIDDate(dateStr: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getPresetDates(preset: PresetKey): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = getJakartaDateString(now);

  if (preset === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === "yesterday") {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestStr = getJakartaDateString(yest);
    return { startDate: yestStr, endDate: yestStr };
  }

  if (preset === "this_week") {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return { startDate: getJakartaDateString(monday), endDate: todayStr };
  }

  if (preset === "this_month") {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: getJakartaDateString(firstOfMonth), endDate: todayStr };
  }

  return { startDate: todayStr, endDate: todayStr };
}

interface DateRangeFilterProps {
  value: DateRangeState;
  onChange: (newValue: DateRangeState) => void;
  disabled?: boolean;
}

const PRESET_LABELS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "this_week", label: "Minggu Ini" },
  { key: "this_month", label: "Bulan Ini" },
  { key: "custom", label: "Kustom" },
];

export function DateRangeFilter({ value, onChange, disabled }: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const [comparisonDropdownOpen, setComparisonDropdownOpen] = useState(false);
  const todayMax = getJakartaDateString(new Date());

  useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  }, [value.startDate, value.endDate]);

  const handleSelectPreset = (preset: PresetKey) => {
    if (preset === "custom") {
      onChange({
        ...value,
        preset: "custom",
      });
      return;
    }

    const { startDate, endDate } = getPresetDates(preset);
    onChange({
      ...value,
      preset,
      startDate,
      endDate,
    });
  };

  const handleApplyCustomDates = (newStart: string, newEnd: string) => {
    if (!newStart || !newEnd) return;
    if (newStart > newEnd) {
      // Swap if user picked start after end
      newStart = newEnd;
    }
    onChange({
      ...value,
      preset: "custom",
      startDate: newStart,
      endDate: newEnd,
    });
  };

  return (
    <div className="space-y-3">
      {/* 1. Quick Presets & Comparison Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto max-w-full">
          {PRESET_LABELS.map((item) => {
            const isActive = value.preset === item.key;
            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectPreset(item.key)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-[#151c2e] text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs border border-slate-200/60 dark:border-white/10"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Comparison Mode Selector */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setComparisonDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="text-slate-400">Vs:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {value.comparison === "previous_equivalent"
                ? "Periode Setara"
                : value.comparison === "none"
                ? "Tanpa Perbandingan"
                : value.comparison}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${comparisonDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {comparisonDropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-white/15 p-1 shadow-xl z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, comparison: "previous_equivalent" });
                  setComparisonDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  value.comparison === "previous_equivalent"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>Periode Lalu (Setara)</span>
                {value.comparison === "previous_equivalent" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, comparison: "none" });
                  setComparisonDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  value.comparison === "none"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>Tanpa Perbandingan</span>
                {value.comparison === "none" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Direct Date Inputs (Always Visible & Interactive) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Rentang Aktif: </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatIDDate(value.startDate)} — {formatIDDate(value.endDate)}
            </span>
          </div>
        </div>

        {/* Interactive HTML5 Date Pickers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Dari:</span>
            <input
              type="date"
              max={todayMax}
              value={customStart}
              disabled={disabled}
              onChange={(e) => {
                setCustomStart(e.target.value);
                handleApplyCustomDates(e.target.value, customEnd);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <span className="text-slate-400 text-xs">s/d</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Sampai:</span>
            <input
              type="date"
              max={todayMax}
              min={customStart}
              value={customEnd}
              disabled={disabled}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                handleApplyCustomDates(customStart, e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
