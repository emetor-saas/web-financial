import { apiFetch } from '@/lib/apiClient';

export type MentorCheckIn = {
  id: string;
  actionTitle: string;
  dueAt: string;
  status: string;
  outcomeNote: string | null;
  respondedAt: string | null;
  createdAt?: string;
};

export async function fetchCheckIns(): Promise<{ checkIns: MentorCheckIn[] }> {
  return apiFetch('/api/mentor/check-ins');
}

export async function respondCheckIn(input: {
  checkInId: string;
  status: 'done' | 'skipped' | 'partial';
  outcomeNote?: string;
}) {
  return apiFetch('/api/mentor/check-ins', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
