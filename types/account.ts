export type AccountType = "bank" | "ewallet" | "cash" | "other";

export interface Account {
  id: number;
  name: string;
  provider?: string | null;
  type: AccountType;
  opening_balance: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  name: string;
  provider?: string | null;
  type: AccountType;
  opening_balance: number;
}

export interface ReconcileAccountInput {
  actual_balance: number;
  note: string;
}

export interface ReconciliationResult {
  account_id: number;
  previous_balance: number;
  actual_balance: number;
  difference: number;
  transaction_id: number | null;
}
