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
  skillVersion?: string;
  mentor?: {
    schema_version: string;
    message_markdown: string;
    primary_action: {
      title: string;
      due_date: string | null;
      amount_brl: number | null;
      completion_criteria: string;
    };
    thirty_day_plan: Array<{ step: string; metric?: string }>;
    questions: string[];
    disclosures: string[];
    requires_human_review: boolean;
  } | null;
  diagnosis?: {
    state: { code: string; label_pt: string };
    priority: { title: string; reason: string; rank: number };
    findings: Array<{ type: string; statement: string }>;
  } | null;
  guardian?: {
    decision: string;
    reasons: string[];
    human_review: boolean;
  };
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
