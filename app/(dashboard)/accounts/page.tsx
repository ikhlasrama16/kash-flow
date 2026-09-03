"use client";

import React, { useState } from "react";
import { Plus, Wallet, Landmark, Smartphone, Banknote, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
import { ReconcileModal } from "@/components/dashboard/reconcile-modal";
import { getAccounts } from "@/lib/api/accounts";
import { Account } from "@/types/account";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AccountsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reconcileTarget, setReconcileTarget] = useState<Account | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = React.useCallback(() => {
    getAccounts()
      .then((data) => {
        setAccounts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load accounts:", err);
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const totalBalance = accounts
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-5 h-5 text-sky-500" />;
      case "ewallet":
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case "cash":
        return <Banknote className="w-5 h-5 text-amber-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wallet className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Rekening & Dompet
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola rekening bank, e-wallet, dan pantau saldo riil yang terkalkulasi otomatis.
            </p>
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs font-semibold shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Rekening</span>
          </Button>
        </div>

        {/* Total Balance Card */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.15)"
          className="p-6 border-slate-200/80 dark:border-white/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Akumulasi Saldo Bersih
              </span>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
                {formatIDR(totalBalance)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Terkalkulasi dari {accounts.length} rekening terdaftar
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* Accounts Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Daftar Rekening</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422]">
              <p className="text-sm text-slate-500">Belum ada rekening yang terdaftar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <Card
                  key={acc.id}
                  className="border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                          {getAccountIcon(acc.type)}
                        </div>
                        <div>
                          <div className="font-bold text-base text-slate-900 dark:text-white">
                            {acc.name}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {acc.provider || acc.type}
                          </div>
                        </div>
                      </div>
                      <Badge variant={acc.is_active ? "success" : "secondary"}>
                        {acc.is_active ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Saldo Saat Ini
                      </span>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatIDR(acc.balance)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Saldo Awal: {formatIDR(acc.opening_balance)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:divide-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Dibuat: {formatDate(acc.created_at)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReconcileTarget(acc)}
                      className="h-8 text-xs hover:border-emerald-500 hover:text-emerald-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Rekonsiliasi</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateAccountModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
        <ReconcileModal
          account={reconcileTarget}
          open={Boolean(reconcileTarget)}
          onOpenChange={(open) => !open && setReconcileTarget(null)}
        />
      </div>
    </PageTransition>
  );
}
