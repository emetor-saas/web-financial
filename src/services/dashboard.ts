import { apiFetch } from '@/lib/apiClient';

export interface DashboardStats {
  month: number;
  year: number;
  dataSource: 'transactions' | 'onboarding' | 'none';
  periodHasTransactions: boolean;
  hasImportedTransactions: boolean;
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
  estimatedFromDiagnostic?: boolean;
  onboardingEstimate?: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    expensesByCategory: DashboardStats['expensesByCategory'];
  } | null;
}

export async function fetchDashboardStats(params?: {
  month?: number;
  year?: number;
}): Promise<DashboardStats> {
  const search = new URLSearchParams();
  if (params?.month) search.set('month', String(params.month));
  if (params?.year) search.set('year', String(params.year));
  const qs = search.toString();
  return apiFetch<DashboardStats>(`/api/dashboard/stats${qs ? `?${qs}` : ''}`);
}

