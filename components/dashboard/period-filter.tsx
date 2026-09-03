"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, Check, Sparkles } from "lucide-react";
import { AvailableMonth } from "@/lib/utils/date-filter";

interface PeriodFilterProps {
  selectedPeriod: string;
  onSelectPeriod: (p: string) => void;
  availableMonths: AvailableMonth[];
  activeLabel: string;
}

const PRESET_OPTIONS = [
  { value: "today", label: "Hari Ini" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "last_week", label: "Minggu Lalu" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "last_month", label: "Bulan Lalu" },
  { value: "all_time", label: "Semua" },
];

export function PeriodFilter({
  selectedPeriod,
  onSelectPeriod,
  availableMonths,
  activeLabel,
}: PeriodFilterProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCustomMonth = selectedPeriod.startsWith("month_");

  return (
    <div className="flex flex-wrap items-center gap-2 relative z-40">
      {/* 1. Quick Presets Bar */}
      <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
        {PRESET_OPTIONS.map((opt) => {
          const isActive = selectedPeriod === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectPeriod(opt.value)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePeriodPill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white dark:bg-[#151c2e] rounded-xl shadow-xs border border-slate-200/60 dark:border-white/10"
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Month Picker Dropdown */}
      <div className="relative z-50" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
            isCustomMonth
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
              : "bg-slate-100/90 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isCustomMonth ? activeLabel : "Pilih Bulan..."}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-white/15 p-2 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 z-[100] text-slate-900 dark:text-white"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Bulan dari Riwayat Transaksi</span>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {availableMonths.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-400 text-center">
                    Belum ada data bulan transaksi
                  </div>
                ) : (
                  availableMonths.map((m) => {
                    const isSelected = selectedPeriod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          onSelectPeriod(m.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate font-medium">{m.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-medium">
                            {m.count} tx
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
