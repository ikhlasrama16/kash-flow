"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryType } from "@/types/category";
import { createCategory } from "@/lib/api/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: CategoryType;
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  defaultType = "expense",
}: CreateCategoryModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      onOpenChange(false);
      setName("");
      setError(null);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal menambahkan kategori");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }

    mutation.mutate({
      name: name.trim(),
      type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>Tambah Kategori Baru</DialogTitle>
        <DialogDescription>
          Kategori digunakan untuk mengelompokkan pengeluaran atau sumber pemasukan.
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
            Jenis Kategori *
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pengeluaran (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pemasukan (Income)
            </button>
          </div>
        </div>

        {/* Category Name */}
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Nama Kategori *
          </label>
          <Input
            placeholder="Contoh: Makanan & Minuman, Transportasi, Gaji, Investasi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
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
            Simpan Kategori
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
