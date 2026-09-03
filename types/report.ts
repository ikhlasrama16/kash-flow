export type ReportPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface ReportSummary {
  income: number;
  expense: number;
  net_cashflow: number;
  transaction_count: number;
  expense_transaction_count: number;
  transfer_count: number;
  average_daily_expense: number;
  reconciliation_adjustment: number;
}

export interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
}

export interface MerchantTotal {
  merchant: string;
  amount: number;
  transaction_count: number;
}

export interface ReportComparison {
  previous_period_expense: number;
  expense_change_amount: number;
  expense_change_percentage: number;
}

export interface AIResult {
  content?: string | null;
  status: "generated" | "unavailable" | "error" | string;
  model?: string;
  generated_at?: string;
}

export interface ReportResponse {
  period: ReportPeriod;
  start_date: string;
  end_date: string;
  summary: ReportSummary;
  expense_by_category: CategoryTotal[];
  top_merchants: MerchantTotal[];
  comparison: ReportComparison;
  ai: AIResult;
}

export interface ReportRequest {
  period: ReportPeriod;
  start_date?: string;
  end_date?: string;
}
