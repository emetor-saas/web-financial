import { apiFetch } from '@/lib/apiClient';

export interface MasterPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  amountInCents: number;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  trialDays: number | null;
  sortOrder: number;
}

export async function listMasterPlans(): Promise<MasterPlan[]> {
  return apiFetch<MasterPlan[]>('/api/master/plans');
}

export async function createMasterPlan(payload: {
  code: string;
  name: string;
  description?: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  amountInCents: number;
  currency: string;
  trialDays?: number;
  sortOrder?: number;
}) {
  return apiFetch<MasterPlan>('/api/master/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMasterPlan(
  id: string,
  payload: Partial<{
    name: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
    trialDays: number | null;
    amountInCents: number;
  }>,
) {
  return apiFetch<MasterPlan>(`/api/master/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateMasterPlan(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/master/plans/${id}`, {
    method: 'DELETE',
  });
}

