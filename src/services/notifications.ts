import { apiFetch } from '@/lib/apiClient';
import type { Alert } from '@/types';

interface ReminderSnippet {
  id: string;
  title: string;
  dueAt: string;
  status: string;
}

export interface InAppNotificationDto {
  id: string;
  title: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  reminder?: ReminderSnippet | null;
}

function statusToType(status: InAppNotificationDto['status']): Alert['type'] {
  if (status === 'FAILED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'info';
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function dtoToAlert(n: InAppNotificationDto): Alert {
  let description = n.body;
  if (n.reminder?.title) {
    const due = n.reminder.dueAt
      ? new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(n.reminder.dueAt))
      : '';
    description = due
      ? `${description}\nLembrete: ${n.reminder.title} (${due})`
      : `${description}\nLembrete: ${n.reminder.title}`;
  }
  return {
    id: n.id,
    title: n.title,
    description,
    type: statusToType(n.status),
    date: formatDateTime(n.createdAt),
  };
}

/**
 * Notificações in-app persistidas (`Notification` no Prisma), via GET /api/notifications.
 */
export async function fetchInAppAlerts(params?: {
  limit?: number;
  householdId?: string;
}): Promise<Alert[]> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.householdId) sp.set('householdId', params.householdId);
  const q = sp.toString();
  const path = q ? `/api/notifications?${q}` : '/api/notifications';
  const rows = await apiFetch<InAppNotificationDto[]>(path);
  return Array.isArray(rows) ? rows.map(dtoToAlert) : [];
}
