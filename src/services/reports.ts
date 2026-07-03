import { apiFetch } from '@/lib/apiClient';
import type { Alert } from '@/services/alerts';

export interface MonthlyHealthReport {
  householdName: string;
  period: { month: number; year: number; label: string };
  dataSource: 'transactions' | 'onboarding' | 'none';
  auraScore: number;
  auraBand: string;
  summary: { income: number; expenses: number; balance: number };
  vsPreviousMonth: {
    incomeChangePct: number | null;
    expenseChangePct: number | null;
    balanceChange: number;
  };
  topCategories: Array<{
    categoryId: string | null;
    categoryName: string;
    color: string | null;
    total: number;
    shareOfExpenses: number;
  }>;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progressPct: number;
    targetDate: string | null;
    isAchieved: boolean;
  }>;
  priorities: string[];
  alerts: Alert[];
  generatedAt: string;
}

export async function fetchMonthlyHealthReport(month?: number, year?: number): Promise<MonthlyHealthReport> {
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const qs = params.toString();
  return apiFetch<MonthlyHealthReport>(`/api/reports/monthly-health${qs ? `?${qs}` : ''}`);
}
