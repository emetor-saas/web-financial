import { apiFetch } from '@/lib/apiClient';

export interface OnboardingStatus {
  hasOnboarding: boolean;
  updatedAt: string | null;
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>('/api/onboarding');
}

