import { apiFetch } from '@/lib/apiClient';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  amountInCents: number;
  currency: string;
  stripePriceId: string | null;
  trialDays: number | null;
}

export async function listPublicPlans(): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>('/api/plans');
}

export async function createCheckout(priceId: string, couponCode?: string) {
  return apiFetch<{ sessionId: string; url: string }>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId, couponCode }),
  });
}

export async function chooseFreePlan(planCode: string) {
  return apiFetch<{ ok: boolean; planCode: string }>('/api/billing/choose-free-plan', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
  });
}

/** Abre o Stripe Customer Portal (cartão, faturas, cancelamento — conforme configuração no Stripe). */
export async function createBillingPortalSession() {
  return apiFetch<{ url: string }>('/api/billing/portal', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Reconcilia assinatura Stripe após checkout (fallback se o webhook atrasar). */
export async function syncBillingFromStripe(sessionId?: string) {
  return apiFetch<{
    synced: boolean;
    reason?: string;
    household?: {
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      planCode?: string | null;
      isActive?: boolean;
    } | null;
  }>('/api/billing/sync', {
    method: 'POST',
    body: JSON.stringify(sessionId ? { sessionId } : {}),
  });
}

