import { apiFetch } from '@/lib/apiClient';

export type OnboardingOption = {
  id: string;
  label: string;
  midValue?: number;
};

export type OnboardingQuestion = {
  id: string;
  type: 'band' | 'single' | 'multi';
  title: string;
  description: string;
  options: OnboardingOption[];
  maxSelections?: number;
  withTargetDetails?: boolean;
};

export type OnboardingStep = {
  id: number;
  title: string;
  subtitle: string;
  questions: OnboardingQuestion[];
};

export type OnboardingSchema = {
  version: number;
  steps: OnboardingStep[];
};

export type OnboardingGoalDetailDraft = {
  targetAmount: string;
  months: string;
};

export type OnboardingGoalDetail = {
  targetAmount: number;
  months: number;
};

/** Respostas do diagnóstico (ids + mapas de valor/prazo das metas). */
export type OnboardingAnswersV2 = {
  [key: string]: string | string[] | Record<string, OnboardingGoalDetailDraft | OnboardingGoalDetail> | undefined;
};

export async function fetchOnboardingSchema(): Promise<OnboardingSchema> {
  return apiFetch<OnboardingSchema>('/api/onboarding/schema');
}

export async function fetchOnboardingStatus(): Promise<{
  hasOnboarding: boolean;
  updatedAt: string | null;
}> {
  return apiFetch('/api/onboarding');
}

function serializeAnswersForSubmit(answers: OnboardingAnswersV2): Record<string, unknown> {
  const out: Record<string, unknown> = { version: 2 };
  for (const [key, value] of Object.entries(answers)) {
    if (key === 'objetivosCurtoMetas' || key === 'objetivosLongoMetas') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const mapped: Record<string, OnboardingGoalDetail> = {};
      for (const [id, row] of Object.entries(value as Record<string, OnboardingGoalDetailDraft>)) {
        const targetAmount = Number(String(row.targetAmount).replace(',', '.'));
        const months = Number(String(row.months).replace(',', '.'));
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) continue;
        if (!Number.isFinite(months) || months < 1) continue;
        mapped[id] = { targetAmount, months: Math.round(months) };
      }
      if (Object.keys(mapped).length > 0) out[key] = mapped;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export async function submitOnboarding(answers: OnboardingAnswersV2): Promise<void> {
  await apiFetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(serializeAnswersForSubmit(answers)),
  });
}

function goalDetailsComplete(
  ids: string[],
  details: Record<string, OnboardingGoalDetailDraft> | undefined,
): boolean {
  if (!details) return false;
  return ids.every((id) => {
    const row = details[id];
    if (!row) return false;
    const amount = Number(String(row.targetAmount).replace(',', '.'));
    const months = Number(String(row.months).replace(',', '.'));
    return Number.isFinite(amount) && amount > 0 && Number.isFinite(months) && months >= 1;
  });
}

export function isStepComplete(step: OnboardingStep, answers: OnboardingAnswersV2): boolean {
  return step.questions.every((q) => {
    const value = answers[q.id];
    if (q.type === 'multi') {
      if (!Array.isArray(value) || value.length === 0) return false;
      if (q.withTargetDetails) {
        const detailsKey = `${q.id}Metas`;
        const details = answers[detailsKey] as Record<string, OnboardingGoalDetailDraft> | undefined;
        return goalDetailsComplete(value, details);
      }
      return true;
    }
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function toggleMultiAnswer(
  current: string[] | undefined,
  optionId: string,
  max: number,
): string[] {
  const set = new Set(current ?? []);
  if (set.has(optionId)) {
    set.delete(optionId);
  } else if (set.size < max) {
    set.add(optionId);
  }
  return [...set];
}
