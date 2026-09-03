import { apiClient } from "./client";
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/types/transaction";

export async function getTransactions(): Promise<Transaction[]> {
  return apiClient<Transaction[]>("/api/v1/transactions");
}

export async function getTransaction(id: number): Promise<Transaction> {
  return apiClient<Transaction>(`/api/v1/transactions/${id}`);
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return apiClient<Transaction>("/api/v1/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTransaction(
  id: number,
  input: UpdateTransactionInput
): Promise<Transaction> {
  return apiClient<Transaction>(`/api/v1/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteTransaction(id: number): Promise<{ id: number }> {
  return apiClient<{ id: number }>(`/api/v1/transactions/${id}`, {
    method: "DELETE",
  });
}
