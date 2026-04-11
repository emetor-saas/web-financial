import { apiFetch } from '@/lib/apiClient';

export interface DashboardStats {
  month: number;
  year: number;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: {
    categoryId: string | null;
    categoryName: string;
    color: string;
    icon: string | null;
    total: number;
  }[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/dashboard/stats');
}

