"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PageHeader, AddAction, SegmentedControl, LoadError, EmptyState, ListSkeleton } from "@/components/ui/finance";
import { CreateCategoryModal } from "@/components/categories/create-category-modal";
import { getCategories } from "@/lib/api/categories";
import { formatDate } from "@/lib/utils";
export default function CategoriesPage() {
  const [open,setOpen] = useState(false);
  const [type,setType] = useState<"all"|"income"|"expense">("all");
  const {data:categories = [],isPending,isError,refetch} = useQuery({queryKey:["categories"],queryFn:getCategories});
  return <div className="finance-page"><PageHeader title="Kategori" description="Atur pemasukan dan pengeluaran agar mudah ditelusuri." actions={<AddAction onClick={() => setOpen(true)}>Tambah kategori</AddAction>} />
    <SegmentedControl label="Jenis kategori" value={type} onChange={setType} options={[{value:"all",label:`Semua (${categories.length})`},{value:"expense",label:"Pengeluaran"},{value:"income",label:"Pemasukan"}]} />
    {isError && <LoadError onRetry={() => void refetch()} />}
    {isPending ? <ListSkeleton /> : !categories.length && !isError ? <section className="surface"><EmptyState title="Belum ada kategori">Buat kategori untuk mengelompokkan transaksi.</EmptyState></section> : <div className="category-groups">{(["expense","income"] as const).filter(group => type === "all" || group === type).map(group => {
      const rows = categories.filter(c => c.type === group);
      const Icon = group === "income" ? ArrowDownLeft : ArrowUpRight;
      return <section key={group}><div className="section-heading"><h2>{group === "expense" ? "Pengeluaran" : "Pemasukan"}</h2><span className="muted-text">{rows.length} kategori</span></div><div className="surface grouped-list">{!rows.length ? <EmptyState title="Belum ada kategori" /> : rows.map(category => <article key={category.id} className="category-row"><span className={`row-icon ${group === "income" ? "income-text" : ""}`}><Icon size={21} /></span><div><h3>{category.name}</h3><p>Ditambahkan {formatDate(category.created_at)}</p></div></article>)}</div></section>;
    })}</div>}
    <CreateCategoryModal open={open} onOpenChange={setOpen} />
  </div>;
}
