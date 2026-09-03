"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountType } from "@/types/account";
import { createAccount } from "@/lib/api/accounts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAccountModal({ open, onOpenChange }: CreateAccountModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [openingBalanceStr, setOpeningBalanceStr] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal menambahkan rekening");
    },
  });

  const resetForm = () => {
    setName("");
    setProvider("");
    setType("bank");
    setOpeningBalanceStr("0");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama rekening wajib diisi");
      return;
    }

    const openingBalance = parseInt(openingBalanceStr.replace(/[^0-9-]/g, ""), 10) || 0;

    mutation.mutate({
      name: name.trim(),
      provider: provider.trim() || null,
      type,
      opening_balance: openingBalance,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>Tambah Rekening / Dompet</DialogTitle>
        <DialogDescription>
          Tambahkan akun bank, e-wallet, atau kas tunai baru untuk dipantau.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Tipe Rekening *
          </label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {(["bank", "ewallet", "cash", "other"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  type === t
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t === "bank" ? "Bank" : t === "ewallet" ? "E-Wallet" : t === "cash" ? "Tunai" : "Lainnya"}
              </button>
            ))}
          </div>
        </div>

        {/* Account Name */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Nama Rekening *
          </label>
          <Input
            placeholder="Contoh: SeaBank Utama, ShopeePay, Dompet Tunai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Provider */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Nama Provider / Bank (Opsional)
          </label>
          <Input
            placeholder="Contoh: SeaBank, Shopee, BCA, Jago"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>

        {/* Opening Balance */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Saldo Awal (Rp)
          </label>
          <Input
            type="number"
            placeholder="0"
            value={openingBalanceStr}
            onChange={(e) => setOpeningBalanceStr(e.target.value)}
            className="tabular-nums"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Saldo awal saat mulai mencatat di sistem ini.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Batal
          </Button>
          <Button type="submit" variant="emerald" isLoading={mutation.isPending}>
            Simpan Rekening
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
