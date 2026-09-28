"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Wallet, Banknote, SlidersHorizontal } from "lucide-react";
import { PageHeader, AddAction, LoadError, EmptyState, ListSkeleton } from "@/components/ui/finance";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
import { ReconcileModal } from "@/components/dashboard/reconcile-modal";
import { getAccounts } from "@/lib/api/accounts";
import type { Account, AccountType } from "@/types/account";
import { formatIDR, formatDate } from "@/lib/utils";

const groups: {type: AccountType; name: string; icon: typeof Landmark}[] = [
  {type:"bank",name:"Rekening bank",icon:Landmark},
  {type:"ewallet",name:"Dompet digital",icon:Wallet},
  {type:"cash",name:"Tunai",icon:Banknote},
  {type:"other",name:"Rekening lainnya",icon:Wallet},
];
export default function AccountsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [reconcile, setReconcile] = useState<Account | null>(null);
  const { data: accounts = [], isPending, isError, refetch } = useQuery({queryKey:["accounts"],queryFn:getAccounts});
  const active = accounts.filter(a => a.is_active);
  const total = active.reduce((sum,a) => sum + Number(a.balance || 0),0);
  return <div className="finance-page">
    <PageHeader title="Rekening" description="Semua tempat kamu menyimpan uang." actions={<AddAction onClick={() => setCreateOpen(true)}>Tambah rekening</AddAction>} />
    {isError && <LoadError onRetry={() => void refetch()} />}
    <section className="account-total" aria-label="Total saldo"><p>Saldo tersedia</p>{isPending ? <div className="skeleton-block balance-skeleton" /> : <strong>{isError && !accounts.length ? "Belum tersedia" : formatIDR(total)}</strong>}<span>{active.length} rekening aktif{accounts.length > active.length ? ` · ${accounts.length - active.length} nonaktif` : ""}</span></section>
    {isPending ? <ListSkeleton /> : !accounts.length && !isError ? <section className="surface"><EmptyState title="Mulai dengan satu rekening">Tambahkan rekening bank, dompet digital, atau uang tunai.</EmptyState></section> : <div className="account-groups">{groups.map(({type,name,icon:Icon}) => {
      const members = accounts.filter(account => account.type === type);
      if (!members.length) return null;
      return <section key={type}><div className="section-heading"><h2>{name}</h2><span className="muted-text">{members.length}</span></div><div className="surface account-group-list">{members.map(account => <article key={account.id} className="account-detail-row"><div className="account-identity"><span className="row-icon"><Icon size={24} strokeWidth={1.6} /></span><div><h3>{account.name}</h3><p>{account.provider || name}{!account.is_active && " · Nonaktif"}</p></div></div><div className="account-current"><strong>{formatIDR(account.balance)}</strong><span>Saldo awal {formatIDR(account.opening_balance)}</span></div><div className="account-detail-footer"><span>Ditambahkan {formatDate(account.created_at)}</span><button className="text-action" type="button" onClick={() => setReconcile(account)}><SlidersHorizontal size={16} />Sesuaikan saldo</button></div></article>)}</div></section>;
    })}</div>}
    <CreateAccountModal open={createOpen} onOpenChange={setCreateOpen} onDataChanged={() => void refetch()} />
    <ReconcileModal account={reconcile} open={Boolean(reconcile)} onOpenChange={open => { if (!open) setReconcile(null); }} onDataChanged={() => void refetch()} />
  </div>;
}
