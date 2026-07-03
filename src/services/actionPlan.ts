import { apiFetch } from '@/lib/apiClient';

export async function fetchActionPlanProgress(): Promise<{ completedIds: string[] }> {
  return apiFetch<{ completedIds: string[]; openFinanceInterest?: string | null }>(
    '/api/action-plan/progress',
  ).then((r) => ({ completedIds: r.completedIds ?? [] }));
}

export async function saveActionPlanProgress(completedIds: string[]): Promise<void> {
  await apiFetch('/api/action-plan/progress', {
    method: 'PUT',
    body: JSON.stringify({ completedIds }),
  });
}

export async function submitOpenFinanceInterest(interest: 'yes' | 'maybe' | 'no'): Promise<void> {
  await apiFetch('/api/feedback/open-finance-interest', {
    method: 'POST',
    body: JSON.stringify({ interest }),
  });
}

export async function fetchOnboardingAnswers(): Promise<Record<string, unknown> | null> {
  const diagnostic = await apiFetch<{ onboardingAnswers?: Record<string, unknown> | null }>(
    '/api/diagnostic/current',
  );
  return diagnostic.onboardingAnswers ?? null;
}

export async function fetchScoreHistory(): Promise<{
  points: Array<{ month: string; score: number; hasData: boolean }>;
  hasData: boolean;
}> {
  return apiFetch('/api/diagnostic/score-history');
}
