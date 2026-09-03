import * as React from "react";
import { cn } from "@/lib/utils";
import { TransactionType, ParseStatus } from "@/types/transaction";
import { NotificationStatus } from "@/types/notification";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "income"
    | "expense"
    | "transfer"
    | "success"
    | "warning"
    | "danger"
    | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default:
      "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-transparent",
    secondary:
      "bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-transparent",
    outline:
      "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    income:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    expense:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    transfer:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    success:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    info:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  if (type === "income") {
    return <Badge variant="income">Income</Badge>;
  }
  if (type === "expense") {
    return <Badge variant="expense">Expense</Badge>;
  }
  return <Badge variant="transfer">Transfer</Badge>;
}

export function ParseStatusBadge({ status }: { status: ParseStatus | string }) {
  switch (status) {
    case "AUTO":
      return <Badge variant="success">Auto</Badge>;
    case "RULE":
      return <Badge variant="info">Rule</Badge>;
    case "MANUAL":
      return <Badge variant="secondary">Manual</Badge>;
    case "NEEDS_REVIEW":
      return <Badge variant="warning">Review</Badge>;
    case "REPROCESS":
      return <Badge variant="default">Reprocess</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus | string }) {
  switch (status) {
    case "parsed":
      return <Badge variant="success">Parsed</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "ignored":
      return <Badge variant="secondary">Ignored</Badge>;
    case "failed":
      return <Badge variant="danger">Failed</Badge>;
    case "detached":
      return <Badge variant="outline">Detached</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
