import { apiFetch } from '@/lib/apiClient';

export interface DebtSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number | null;
  monthlyImpact: number;
  potentialSaving: number;
  attackOrder: number;
  estimatedFromOnboarding?: boolean;
  sourceNote?: string;
}

export async function fetchDebts(): Promise<DebtSummary[]> {
  return apiFetch<DebtSummary[]>('/api/debts');
}

