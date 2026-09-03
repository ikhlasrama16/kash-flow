export type CategoryType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}
