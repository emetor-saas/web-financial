import { apiFetch } from '@/lib/apiClient';

export type ConsentRecord = {
  id: string;
  purpose: string;
  grantedAt: string;
  revokedAt: string | null;
  channel: string;
  policyVersion: string;
  note?: string;
};

export async function fetchConsents(): Promise<{ consents: ConsentRecord[]; policyVersion: string }> {
  return apiFetch('/api/privacy/consents');
}

export async function grantConsent(purpose: string, channel = 'app') {
  return apiFetch<{ consent: ConsentRecord }>('/api/privacy/consents', {
    method: 'POST',
    body: JSON.stringify({ purpose, channel }),
  });
}

export async function revokeConsent(id: string) {
  return apiFetch<{ consent: ConsentRecord }>(`/api/privacy/consents?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
