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
  userMessageId?: string;
  assistantMessageId?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export async function fetchAssistantChatHistory(
  mode: 'tenant' | 'master' = 'tenant',
): Promise<AiChatMessage[]> {
  const params = new URLSearchParams({ mode });
  const data = await apiFetch<{ messages: AiChatMessage[] }>(
    `/api/ai/assistant/messages?${params.toString()}`,
  );
  return data.messages;
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

export async function clearAssistantChatHistory(
  mode: 'tenant' | 'master' = 'tenant',
): Promise<void> {
  const params = new URLSearchParams({ mode });
  await apiFetch<{ success: boolean }>(`/api/ai/assistant/messages?${params.toString()}`, {
    method: 'DELETE',
  });
}
