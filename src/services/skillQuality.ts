import { apiFetch } from '@/lib/apiClient';

export type SkillQualityPayload = {
  skillVersion: string;
  windowDays: number;
  totals: {
    interactions: number;
    passRate: number;
    blockRate: number;
    fallbackRate: number;
    reviseRate: number;
    guardianBlockRate: number;
    estimatedCostUsd: number;
  };
  stateDistribution: Record<string, number>;
  alerts?: {
    overdueHumanReviews: number;
    passRateLow: boolean;
  };
  pendingHumanReviews: Array<{
    householdId: string;
    householdName: string;
    overdue?: boolean;
    ticket: {
      id: string;
      reason: string;
      createdAt: string;
      status: string;
      diagnosisState?: string | null;
      slaDueAt?: string | null;
      comments?: Array<{
        id: string;
        body: string;
        authorName: string | null;
        createdAt: string;
      }>;
    };
  }>;
};

export async function fetchSkillQuality(): Promise<SkillQualityPayload> {
  return apiFetch('/api/master/skill/quality');
}

export async function resolveSkillReview(input: {
  householdId: string;
  ticketId: string;
  status: 'resolved' | 'dismissed';
  note?: string;
}) {
  return apiFetch('/api/master/skill/quality', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function commentSkillReview(input: {
  householdId: string;
  ticketId: string;
  body: string;
}) {
  return apiFetch('/api/master/skill/review-comments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
