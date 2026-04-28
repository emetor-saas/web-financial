import { apiFetch } from '@/lib/apiClient';

export interface ReminderDto {
  id: string;
  householdId: string;
  userId: string | null;
  title: string;
  message: string | null;
  dueAt: string;
  status: string;
  user?: { id: string; name: string; email: string } | null;
}

export async function fetchReminders(): Promise<ReminderDto[]> {
  return apiFetch<ReminderDto[]>('/api/reminders');
}
