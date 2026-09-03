"use client";

import React, { useState, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/react-bits/page-transition";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { AccountCards } from "@/components/dashboard/account-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CreateTransactionModal } from "@/components/dashboard/create-transaction-modal";
import { ReconcileModal } from "@/components/dashboard/reconcile-modal";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactions } from "@/lib/api/transactions";
import { getCategories } from "@/lib/api/categories";
import { Account } from "@/types/account";
import { Transaction } from "@/types/transaction";
import { Category } from "@/types/category";
import {
  filterTransactionsByPeriod,
  getAvailableMonths,
  buildTimeSeriesChartData,
  computeSummaryMetrics,
  getDateRangeForPeriod,
} from "@/lib/utils/date-filter";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "Selamat pagi 🌅";
  if (hour >= 11 && hour < 15) return "Selamat siang ☀️";
  if (hour >= 15 && hour < 18) return "Selamat sore 🌇";
  return "Selamat malam 🌙";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>("this_month");
  const [createTxOpen, setCreateTxOpen] = useState(false);
  const [reconcileAccount, setReconcileAccount] = useState<Account | null>(null);

  // Native state with immediate useEffect fetch
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const loadData = React.useCallback(() => {
    setAccountsLoading(true);
    setTransactionsLoading(true);

    Promise.all([
      getAccounts().catch(() => [] as Account[]),
      getTransactions().catch(() => [] as Transaction[]),
      getCategories().catch(() => [] as Category[]),
    ]).then(([accs, txs, cats]) => {
      setAccounts(accs);
      setTransactions(txs);
      setCategories(cats);
      setAccountsLoading(false);
      setTransactionsLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  // Extract available months from transactions
  const availableMonths = useMemo(() => {
    return getAvailableMonths(transactions);
  }, [transactions]);

  // If user is on default "this_month" and has 0 transactions this month,
  // but has transactions in previous month, we can let user easily toggle or see label
  const { label: activePeriodLabel } = useMemo(() => {
    return getDateRangeForPeriod(period);
  }, [period]);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  // Time-series chart points (line/area/bar data)
  const chartData = useMemo(() => {
    return buildTimeSeriesChartData(filteredTransactions, period);
  }, [filteredTransactions, period]);

  // Calculate summary metrics (Income, Expense, Net, Comparison)
  const { summary: activeSummary, comparison } = useMemo(() => {
    return computeSummaryMetrics(filteredTransactions, transactions, period);
  }, [filteredTransactions, transactions, period]);

  // Calculate top categories for the filtered transactions
  const activeCategories = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const totals = new Map<string, number>();

    for (const tx of filteredTransactions) {
      if (tx.type === "expense") {
        const name = tx.category_id ? catMap.get(tx.category_id) || "Lainnya" : "Lainnya";
        totals.set(name, (totals.get(name) || 0) + Number(tx.amount));
      }
    }

    const totalExp = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    const result: { category: string; amount: number; percentage: number }[] = [];
    for (const [category, amount] of totals.entries()) {
      result.push({
        category,
        amount,
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      });
    }
    return result.sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [filteredTransactions, categories]);

  return (
    <PageTransition>
      <div className="space-y-6 md:space-y-8">
        {/* Header with Greeting & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{getGreeting()}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Berikut ringkasan kondisi keuangan & arus kas Anda untuk periode{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {activePeriodLabel}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs backdrop-blur-sm bg-white/80 dark:bg-white/5 cursor-pointer"
              title="Perbarui data"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Muat Ulang</span>
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setCreateTxOpen(true)}
              className="text-xs font-semibold shadow-lg shadow-emerald-500/25 cursor-pointer hover:shadow-emerald-500/40 transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Catat Transaksi</span>
            </Button>
          </div>
        </div>

        {/* Period & Month Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#0c111d]/70 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs relative z-30"
        >
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Filter Periode Transaksi:</span>
          </div>

          <PeriodFilter
            selectedPeriod={period}
            onSelectPeriod={(p) => setPeriod(p)}
            availableMonths={availableMonths}
            activeLabel={activePeriodLabel}
          />
        </motion.div>

        {/* 1. Summary Stat Cards */}
        <SummaryCards
          accounts={accounts}
          summary={activeSummary}
          comparison={comparison}
          periodLabel={activePeriodLabel}
        />

        {/* 2. Charts Section (Cashflow Area/Line Chart + Categories Breakdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashflowChart
              data={chartData}
              income={activeSummary.income}
              expense={activeSummary.expense}
              netCashflow={activeSummary.net_cashflow}
              periodLabel={activePeriodLabel}
              isLoading={transactionsLoading}
            />
          </div>

          <div className="lg:col-span-1">
            <CategoryBreakdown
              categories={activeCategories}
              periodLabel={activePeriodLabel}
              isLoading={transactionsLoading}
            />
          </div>
        </div>

        {/* 3. Accounts Summary Cards */}
        <AccountCards
          accounts={accounts}
          onReconcile={(acc) => setReconcileAccount(acc)}
          isLoading={accountsLoading}
        />

        {/* 4. Recent Transactions */}
        <RecentTransactions
          transactions={filteredTransactions.length > 0 ? filteredTransactions : transactions}
          accounts={accounts}
          categories={categories}
          isLoading={transactionsLoading}
        />

        {/* Modals */}
        <CreateTransactionModal
          open={createTxOpen}
          onOpenChange={setCreateTxOpen}
          accounts={accounts}
          categories={categories}
        />

        <ReconcileModal
          account={reconcileAccount}
          open={Boolean(reconcileAccount)}
          onOpenChange={(open) => !open && setReconcileAccount(null)}
        />
      </div>
    </PageTransition>
  );
}
