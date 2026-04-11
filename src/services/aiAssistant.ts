import { apiFetch } from '@/lib/apiClient';

export interface AiAssistantRequest {
  householdId?: string;
  mode?: 'tenant' | 'master';
  message: string;
  month?: number;
  year?: number;
}

export interface AiAssistantResponse {
  mode: 'tenant' | 'master';
  answer: string;
  summary: unknown;
  hasOpenAI: boolean;
}

export async function askFinancialAssistant(
  payload: AiAssistantRequest,
): Promise<AiAssistantResponse> {
  const now = new Date();

  return apiFetch<AiAssistantResponse>('/api/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({
      mode: payload.mode ?? 'tenant',
      month: payload.month ?? now.getMonth() + 1,
      year: payload.year ?? now.getFullYear(),
      ...payload,
    }),
  });
}

