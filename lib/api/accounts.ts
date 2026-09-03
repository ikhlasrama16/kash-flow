import { apiClient } from "./client";
import { Account, CreateAccountInput, ReconcileAccountInput, ReconciliationResult } from "@/types/account";

export async function getAccounts(): Promise<Account[]> {
  return apiClient<Account[]>("/api/v1/accounts");
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  return apiClient<Account>("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function reconcileAccount(
  accountId: number,
  input: ReconcileAccountInput
): Promise<ReconciliationResult> {
  return apiClient<ReconciliationResult>(`/api/v1/accounts/${accountId}/reconcile`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
