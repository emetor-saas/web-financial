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

export type CreateGoalInput = {
  name: string;
  description?: string | null;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string | null;
  monthlyContribution?: number | null;
};

export type UpdateGoalInput = Partial<CreateGoalInput> & {
  isAchieved?: boolean;
};

export async function fetchGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>('/api/goals');
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  return apiFetch<Goal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  return apiFetch<Goal>(`/api/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
}
