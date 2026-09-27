"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Landmark,
  Wallet,
  Banknote,
  ArrowDownLeft,
  ArrowLeftRight,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { getAccounts } from "@/lib/api/accounts";
import { getTransactions } from "@/lib/api/transactions";
import { getCategories } from "@/lib/api/categories";
import { formatIDR, formatDate } from "@/lib/utils";
import {
  filterTransactionsByPeriod,
  getAvailableMonths,
  getDateRangeForPeriod,
  computeSummaryMetrics,
} from "@/lib/utils/date-filter";
import { CreateTransactionModal } from "@/components/dashboard/create-transaction-modal";
import { ReconcileModal } from "@/components/dashboard/reconcile-modal";
import { Account } from "@/types/account";

export default function DashboardPage() {
  const [period, setPeriod] = useState("this_month");
  const [createOpen, setCreateOpen] = useState(false);
  const [reconcile, setReconcile] = useState<Account | null>(null);
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const accounts = accountsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const activeAccounts = accounts.filter((account) => account.is_active);
  const balance = activeAccounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0,
  );
  const filtered = filterTransactionsByPeriod(transactions, period);
  const recent = [...filtered]
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )
    .slice(0, 5);
  const { summary } = computeSummaryMetrics(filtered, transactions, period);
  const months = getAvailableMonths(transactions);
  const { label } = getDateRangeForPeriod(period);
  const maxAmount = Math.max(summary.income, summary.expense, 1);
  const loading = accountsQuery.isPending || transactionsQuery.isPending;
  const failed =
    accountsQuery.isError ||
    transactionsQuery.isError ||
    categoriesQuery.isError;
  const refreshing =
    accountsQuery.isFetching ||
    transactionsQuery.isFetching ||
    categoriesQuery.isFetching;
  const refresh = () => {
    void accountsQuery.refetch();
    void transactionsQuery.refetch();
    void categoriesQuery.refetch();
  };
  const accountName = (id?: number | null) =>
    accounts.find((account) => account.id === id)?.name || "Rekening";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const createAction = (
    <button
      className="text-action create-action"
      type="button"
      onClick={() => setCreateOpen(true)}
      disabled={
        accountsQuery.isPending ||
        accountsQuery.isError ||
        categoriesQuery.isPending ||
        categoriesQuery.isError
      }
    >
      <span className="plus-circle">
        <Plus size={22} />
      </span>
      Catat transaksi
    </button>
  );
  return (
    <div className="overview">
      <header className="overview-header">
        <div>
          <p className="overview-date" suppressHydrationWarning>
            {today}
          </p>
          <h1>Ringkasan</h1>
        </div>
        <div className="overview-actions">
          <div className="desktop-create">{createAction}</div>
          <button
            className="icon-button"
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Muat ulang data"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>
      {failed && (
        <div role="alert" className="overview-error">
          Sebagian data belum berhasil dimuat. Data yang tersedia tetap
          ditampilkan.
          <button type="button" onClick={refresh} disabled={refreshing}>
            Coba lagi
          </button>
        </div>
      )}
      <div className="overview-grid">
        <section className="balance-section" aria-label="Saldo rekening">
          <p className="section-caption">Saldo tersedia</p>
          {accountsQuery.isPending ? (
            <div
              className="balance-skeleton skeleton-block"
              aria-label="Memuat saldo"
            />
          ) : (
            <p className="balance-value">
              {accountsQuery.isError && !accountsQuery.data
                ? "—"
                : formatIDR(balance).replace("Rp ", "Rp")}
            </p>
          )}
          <p className="balance-note">
            {accountsQuery.isError && !accountsQuery.data
              ? "Saldo belum tersedia"
              : `Tersebar di ${activeAccounts.length} rekening aktif`}
          </p>
          <Link className="text-action balance-link" href="/accounts">
            Lihat rekening <ChevronRight size={17} />
          </Link>
        </section>
        <section
          className="monthly-panel surface"
          aria-label="Ringkasan periode"
        >
          <div className="monthly-heading">
            <label className="sr-only" htmlFor="overview-period">
              Periode transaksi
            </label>
            <select
              id="overview-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <optgroup label="Periode">
                <option value="this_month">
                  {getDateRangeForPeriod("this_month").label}
                </option>
                <option value="last_month">Bulan lalu</option>
                <option value="today">Hari ini</option>
                <option value="this_week">Minggu ini</option>
                <option value="last_week">Minggu lalu</option>
                <option value="all_time">Semua waktu</option>
              </optgroup>
              {months.length > 0 && (
                <optgroup label="Riwayat bulanan">
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          {transactionsQuery.isPending ? (
            <div
              className="monthly-loading"
              role="status"
              aria-label="Memuat ringkasan"
            >
              <div className="skeleton-block" />
              <div className="skeleton-block" />
            </div>
          ) : transactionsQuery.isError && !transactionsQuery.data ? (
            <p className="empty-state">
              Ringkasan belum tersedia. Coba muat ulang.
            </p>
          ) : (
            <>
              <div className="comparison-row">
                <div>
                  <span>Masuk</span>
                  <strong>{formatIDR(summary.income)}</strong>
                </div>
                <div className="comparison-track" aria-hidden="true">
                  <span
                    className="income-bar"
                    style={{ width: `${(summary.income / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="comparison-row">
                <div>
                  <span>Keluar</span>
                  <strong>{formatIDR(summary.expense)}</strong>
                </div>
                <div className="comparison-track" aria-hidden="true">
                  <span
                    className="expense-bar"
                    style={{ width: `${(summary.expense / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="cashflow-note">
                <span
                  className={
                    summary.net_cashflow < 0
                      ? "cashflow-dot expense-bar"
                      : "cashflow-dot income-bar"
                  }
                />
                <div>
                  <p>
                    {summary.net_cashflow < 0
                      ? "Pengeluaran lebih besar"
                      : summary.net_cashflow > 0
                        ? "Pemasukan lebih besar"
                        : "Pemasukan dan pengeluaran seimbang"}
                  </p>
                  <strong>{formatIDR(Math.abs(summary.net_cashflow))}</strong>
                </div>
              </div>
            </>
          )}
        </section>
        <div className="mobile-create">{createAction}</div>
        <section className="activity-section">
          <div className="section-heading">
            <h2>Aktivitas terbaru</h2>
            <Link href="/transactions" className="text-action">
              Lihat semua
            </Link>
          </div>
          <div
            className="surface activity-list"
            aria-busy={transactionsQuery.isPending}
          >
            {transactionsQuery.isPending ? (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="activity-skeleton skeleton-block" />
              ))
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <ShoppingBag size={28} />
                <h3>
                  {transactionsQuery.isError
                    ? "Aktivitas belum tersedia"
                    : "Belum ada transaksi"}
                </h3>
                <p>
                  {transactionsQuery.isError
                    ? "Coba muat ulang untuk melihat aktivitas."
                    : `Transaksi untuk ${label.toLowerCase()} akan muncul di sini.`}
                </p>
              </div>
            ) : (
              recent.map((tx) => {
                const Icon =
                  tx.type === "income"
                    ? ArrowDownLeft
                    : tx.type === "transfer"
                      ? ArrowLeftRight
                      : ShoppingBag;
                const account =
                  tx.type === "transfer"
                    ? `${accountName(tx.source_account_id)} → ${accountName(tx.destination_account_id)}`
                    : accountName(
                        tx.type === "income"
                          ? tx.destination_account_id
                          : tx.source_account_id,
                      );
                return (
                  <Link
                    key={tx.id}
                    href={`/transactions/${tx.id}`}
                    className="activity-row"
                  >
                    <span className="row-icon">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <div className="activity-description">
                      <strong>
                        {tx.merchant ||
                          tx.description ||
                          (tx.type === "income"
                            ? "Pemasukan"
                            : tx.type === "transfer"
                              ? "Transfer"
                              : "Pengeluaran")}
                      </strong>
                      <span>
                        {formatDate(tx.occurred_at)} · {account}
                      </span>
                      {tx.parse_status === "NEEDS_REVIEW" && (
                        <span className="review-note">Perlu diperiksa</span>
                      )}
                    </div>
                    <strong
                      className={`activity-amount ${tx.type === "income" ? "income-text" : ""}`}
                    >
                      {tx.type === "income"
                        ? "+"
                        : tx.type === "expense"
                          ? "−"
                          : ""}
                      {formatIDR(tx.amount).replace("Rp ", "Rp")}
                    </strong>
                  </Link>
                );
              })
            )}
          </div>
        </section>
        <section className="accounts-section">
          <div className="section-heading">
            <h2>Rekening</h2>
            <Link href="/accounts" className="text-action">
              Semua <ChevronRight size={17} />
            </Link>
          </div>
          <div className="surface account-list">
            {accountsQuery.isPending ? (
              <div className="activity-skeleton skeleton-block" />
            ) : activeAccounts.length === 0 ? (
              <div className="empty-state">
                <p>
                  {accountsQuery.isError
                    ? "Rekening belum tersedia."
                    : "Tambahkan rekening untuk mulai mencatat keuangan."}
                </p>
                <Link className="text-action" href="/accounts">
                  Buka rekening <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              activeAccounts.slice(0, 3).map((account) => {
                const Icon =
                  account.type === "bank"
                    ? Landmark
                    : account.type === "cash"
                      ? Banknote
                      : Wallet;
                return (
                  <div key={account.id} className="account-row">
                    <Link href="/accounts" className="account-info">
                      <span className="row-icon">
                        <Icon size={23} strokeWidth={1.6} />
                      </span>
                      <span>
                        <strong>{account.name}</strong>
                        <small>
                          {account.provider ||
                            {
                              bank: "Rekening bank",
                              ewallet: "Dompet digital",
                              cash: "Tunai",
                              other: "Rekening lainnya",
                            }[account.type]}
                        </small>
                      </span>
                    </Link>
                    <div className="account-balance">
                      <strong>
                        {formatIDR(account.balance).replace("Rp ", "Rp")}
                      </strong>
                      <button
                        type="button"
                        aria-label={`Sesuaikan saldo ${account.name}`}
                        title="Sesuaikan saldo"
                        onClick={() => setReconcile(account)}
                      >
                        <SlidersHorizontal size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {activeAccounts.length > 3 && (
              <p className="account-footnote">
                Menampilkan 3 dari {activeAccounts.length} rekening aktif
              </p>
            )}
          </div>
          <div className="analytics-link">
            <Link className="text-action" href="/analytics">
              Buka analisis <ArrowRight size={18} />
            </Link>
            <p>Lihat tren dan rincian pengeluaran.</p>
          </div>
        </section>
      </div>
      <CreateTransactionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        categories={categories}
        onDataChanged={refresh}
      />
      <ReconcileModal
        account={reconcile}
        open={Boolean(reconcile)}
        onOpenChange={(open) => {
          if (!open) setReconcile(null);
        }}
        onDataChanged={refresh}
      />
      <span className="sr-only" role="status">
        {loading ? "Memuat data keuangan" : "Data keuangan selesai dimuat"}
      </span>
    </div>
  );
}
