"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CategoryTotal } from "@/types/report";
import { formatIDR } from "@/lib/utils";
import { PieChart } from "lucide-react";

interface CategoryBreakdownProps {
  categories: CategoryTotal[];
  periodLabel: string;
  isLoading?: boolean;
}

const CATEGORY_COLORS = [
  "bg-emerald-500 text-emerald-500",
  "bg-blue-500 text-blue-500",
  "bg-amber-500 text-amber-500",
  "bg-purple-500 text-purple-500",
  "bg-rose-500 text-rose-500",
  "bg-cyan-500 text-cyan-500",
  "bg-indigo-500 text-indigo-500",
  "bg-orange-500 text-orange-500",
];

export function CategoryBreakdown({ categories, periodLabel, isLoading }: CategoryBreakdownProps) {
  return (
    <Card className="border-slate-200/80 dark:border-white/10 h-full relative overflow-hidden backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg">Distribusi Pengeluaran</CardTitle>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium border border-slate-200/60 dark:border-white/5">
            {periodLabel}
          </span>
        </div>
        <CardDescription className="text-xs">Kategori belanja terbanyak pada periode ini</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="flex justify-between h-4 bg-slate-200 dark:bg-white/5 rounded-md" />
                <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-2">
              <PieChart className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Belum ada pengeluaran
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Data kategori akan muncul saat ada transaksi belanja pada {periodLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {categories.map((item, idx) => {
              const colorInfo = CATEGORY_COLORS[idx % CATEGORY_COLORS.length].split(" ");
              const bgColor = colorInfo[0];
              const pct = Math.min(Math.max(item.percentage, 0), 100);

              return (
                <motion.div
                  key={item.category || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${bgColor}`} />
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {item.category || "Tanpa Kategori"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 tabular-nums shrink-0">
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {formatIDR(item.amount)}
                      </span>
                      <span className="text-slate-400 text-[11px] w-9 text-right font-medium">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                      className={`h-full rounded-full ${bgColor}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
