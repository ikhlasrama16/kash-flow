"use client";

import React from "react";
import { Account } from "@/types/account";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { Landmark, Smartphone, Banknote, HelpCircle, RefreshCw } from "lucide-react";

interface AccountCardsProps {
  accounts: Account[];
  onReconcile: (account: Account) => void;
  isLoading?: boolean;
}

export function AccountCards({ accounts, onReconcile, isLoading }: AccountCardsProps) {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-4 h-4 text-sky-500" />;
      case "ewallet":
        return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case "cash":
        return <Banknote className="w-4 h-4 text-amber-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-slate-200/80 dark:border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Ringkasan Rekening & Dompet</CardTitle>
          <CardDescription>Saldo terkalkulasi otomatis berdasarkan transaksi</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">
            Belum ada rekening terdaftar. Tambahkan rekening baru di menu Akun.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 shadow-2xs border border-slate-200/50 dark:border-white/5">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                        {acc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {acc.provider || acc.type}
                      </div>
                    </div>
                  </div>
                  <Badge variant={acc.is_active ? "success" : "secondary"}>
                    {acc.is_active ? "Aktif" : "Non-aktif"}
                  </Badge>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Saldo Saat Ini
                    </span>
                    <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatIDR(acc.balance)}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReconcile(acc)}
                    className="h-7 px-2 text-xs text-slate-500 hover:text-emerald-500 group-hover:bg-white dark:group-hover:bg-white/5"
                    title="Sesuaikan saldo riil (Rekonsiliasi)"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Sinkron</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
