"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { AnimatedNumber } from "@/components/react-bits/animated-number";
import { ReportSummary, ReportComparison } from "@/types/report";
import { Account } from "@/types/account";
import { formatIDR } from "@/lib/utils";

interface SummaryCardsProps {
  accounts: Account[];
  summary?: ReportSummary;
  comparison?: ReportComparison;
  periodLabel: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  }),
};

export function SummaryCards({ accounts, summary, comparison, periodLabel }: SummaryCardsProps) {
  // Total balance = sum of calculated balances of active accounts
  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const netCashflow = summary?.net_cashflow || 0;

  const expenseChangePct = comparison?.expense_change_percentage ?? 0;
  const isExpenseLower = expenseChangePct <= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* 1. Total Balance */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.18)"
          className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Saldo Bersih
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              <AnimatedNumber value={totalBalance} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Dari {accounts.filter((a) => a.is_active).length} akun aktif
            </p>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 2. Total Income */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.15)"
          className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Pemasukan
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[100px]">
                {periodLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              <AnimatedNumber value={income} showSign={income > 0} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {summary?.transaction_count ? `${summary.transaction_count} transaksi total` : "Periode ini"}
            </p>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 3. Total Expense */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
        <SpotlightCard
          spotlightColor="rgba(244, 63, 94, 0.15)"
          className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm hover:shadow-md hover:border-rose-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Pengeluaran
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium truncate max-w-[100px]">
                {periodLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500/20 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
              <AnimatedNumber value={expense > 0 ? -expense : 0} />
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {comparison ? (
                <span
                  className={`inline-flex items-center font-medium ${
                    isExpenseLower ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isExpenseLower ? (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {Math.abs(expenseChangePct).toFixed(1)}% vs lalu
                </span>
              ) : (
                <span className="text-slate-400">Rerata: {formatIDR(summary?.average_daily_expense || 0)}/hr</span>
              )}
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 4. Net Cashflow */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
        <SpotlightCard
          spotlightColor="rgba(6, 182, 212, 0.15)"
          className="p-5 border-slate-200/80 dark:border-white/10 backdrop-blur-xs bg-white/90 dark:bg-[#0c111d]/90 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                Net Cashflow
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium truncate max-w-[100px]">
                {periodLabel}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/20 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                netCashflow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              <AnimatedNumber value={netCashflow} showSign={netCashflow !== 0} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {netCashflow > 0
                ? "Surplus kas positif ✨"
                : netCashflow < 0
                ? "Defisit pengeluaran"
                : "Kas seimbang"}
            </p>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
