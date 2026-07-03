import { apiFetch } from '@/lib/apiClient';

export type JourneyStepStatus = 'completed' | 'in_progress' | 'current' | 'pending';

export interface JourneyStep {
  id: string;
  order: number;
  title: string;
  description: string;
  status: JourneyStepStatus;
  cta: { label: string; href: string };
  items?: string[];
  action?: string | null;
  meta?: { pendingJob?: boolean; lastFileName?: string } | null;
}

export interface JourneyCurrent {
  headline: string;
  currentStepId: string;
  dataSource: 'transactions' | 'onboarding' | 'none';
  hasOnboarding: boolean;
  hasImportedTransactions: boolean;
  auraScore: number;
  auraBand: string;
  steps: JourneyStep[];
  onboardingInsights: {
    risks: string[];
    priorities: string[];
  } | null;
  summaryExecutive: string[];
  proactiveAlerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'info' | 'warning' | 'danger';
    category?: string;
  }>;
}

export async function fetchJourneyCurrent(): Promise<JourneyCurrent> {
  return apiFetch<JourneyCurrent>('/api/journey/current');
}
