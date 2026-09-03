"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Tag, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { CreateCategoryModal } from "@/components/categories/create-category-modal";
import { getCategories } from "@/lib/api/categories";
import { formatDate } from "@/lib/utils";

export default function CategoriesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "expense" | "income">("all");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const displayedCategories =
    activeTab === "all"
      ? categories
      : activeTab === "expense"
      ? expenseCategories
      : incomeCategories;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Tag className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Kategori Transaksi
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Klasifikasi transaksi untuk pengelompokan laporan dan anggaran keuangan.
            </p>
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs font-semibold shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Kategori</span>
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-[#161e31] text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expense")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "expense"
                ? "bg-white dark:bg-[#161e31] text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Pengeluaran ({expenseCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "income"
                ? "bg-white dark:bg-[#161e31] text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Pemasukan ({incomeCategories.length})
          </button>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422]">
            <p className="text-sm text-slate-500">Belum ada kategori dalam daftar ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs flex items-center justify-between hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      cat.type === "income"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {cat.type === "income" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Dibuat: {formatDate(cat.created_at)}
                    </div>
                  </div>
                </div>

                <Badge variant={cat.type === "income" ? "income" : "expense"}>
                  {cat.type === "income" ? "Pemasukan" : "Pengeluaran"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateCategoryModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </div>
    </PageTransition>
  );
}
