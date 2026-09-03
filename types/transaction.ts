export type TransactionType = "income" | "expense" | "transfer";

export type ParseStatus = "AUTO" | "RULE" | "MANUAL" | "NEEDS_REVIEW" | "REPROCESS";

export type TransactionSource = "manual" | "notification" | "reprocess" | "import" | "reconcile";

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  source_account_id?: number | null;
  destination_account_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  merchant?: string | null;
  parse_status: ParseStatus;
  confidence?: number | null;
  source: TransactionSource;
  raw_notification_id?: number | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  source_account_id?: number | null;
  destination_account_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  occurred_at: string;
}

export interface UpdateTransactionInput {
  category_id?: number | null;
  merchant?: string | null;
  description?: string | null;
  learn_rule?: boolean;
}
