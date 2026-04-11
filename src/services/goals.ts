import { apiFetch } from '@/lib/apiClient';

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  monthlyContribution: number | null;
  isAchieved: boolean;
}

export async function fetchGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>('/api/goals');
}

