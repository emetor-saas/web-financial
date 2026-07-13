import { apiFetch } from '@/lib/apiClient';

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isEssential: boolean;
  budgetLimit: number | null;
  order: number;
  isDefault?: boolean;
  _count?: { transactions: number };
};

export type CreateCategoryInput = {
  name: string;
  icon?: string | null;
  color?: string | null;
  isEssential?: boolean;
  budgetLimit?: number | null;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput> & {
  order?: number;
};

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
}
