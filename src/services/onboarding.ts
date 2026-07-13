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

export type OnboardingAnswersV2 = Record<string, string | string[]>;

export async function fetchOnboardingSchema(): Promise<OnboardingSchema> {
  return apiFetch<OnboardingSchema>('/api/onboarding/schema');
}

export async function fetchOnboardingStatus(): Promise<{
  hasOnboarding: boolean;
  updatedAt: string | null;
}> {
  return apiFetch('/api/onboarding');
}

export async function submitOnboarding(answers: OnboardingAnswersV2): Promise<void> {
  await apiFetch('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify({ version: 2, ...answers }),
  });
}

export function isStepComplete(step: OnboardingStep, answers: OnboardingAnswersV2): boolean {
  return step.questions.every((q) => {
    const value = answers[q.id];
    if (q.type === 'multi') {
      return Array.isArray(value) && value.length > 0;
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
