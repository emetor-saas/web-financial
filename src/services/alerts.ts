import { apiFetch } from '@/lib/apiClient';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'info' | 'warning' | 'danger';
  horizon: 'short' | 'medium' | 'long';
  category?: 'spending' | 'goal' | 'reserve' | 'debt' | 'balance' | 'general';
}

export interface AlertsResponse {
  alerts: Alert[];
}

export async function fetchAlerts(): Promise<AlertsResponse> {
  return apiFetch<AlertsResponse>('/api/alerts');
}

