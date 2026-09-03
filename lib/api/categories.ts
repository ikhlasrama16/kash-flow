import { apiClient } from "./client";
import { Category, CreateCategoryInput } from "@/types/category";

export async function getCategories(): Promise<Category[]> {
  return apiClient<Category[]>("/api/v1/categories");
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiClient<Category>("/api/v1/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
