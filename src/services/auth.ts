import { apiFetch } from '@/lib/apiClient';

/** Billing retornado por /api/auth/login e /api/auth/me */
export interface UserBilling {
  canUseApp: boolean;
  canUseChat: boolean;
  trialEndsAt: string;
  inFreeTrial: boolean;
  hasPaidSubscription: boolean;
}

export interface AuthUser {
  id: string;
  householdId: string;
  email: string;
  name: string;
  role: 'MASTER' | 'TENANT_USER' | string;
  avatar?: string | null;
  language?: string | null;
  household: {
    id: string;
    name: string;
    planCode: string | null;
    subscriptionStatus: string;
    isActive: boolean;
    /** Quantidade de usuários do tenant no household (exclui MASTER). Para exibir “Espaço Casal”. */
    tenantMemberCount?: number;
    /** Fim do período / data em que o acesso pago encerra (inclui cancelamento agendado). */
    nextBillingDate?: string | null;
    /** Pedido de cancelamento na Stripe (pode existir com status ainda ACTIVE). */
    canceledAt?: string | null;
    /** Cartão/método da assinatura Stripe (bandeira + últimos 4), quando disponível */
    billingPaymentMethod?: {
      brand: string | null;
      last4: string | null;
      expMonth: number | null;
      expYear: number | null;
    } | null;
  };
  billing?: UserBilling;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.user;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch<MeResponse>('/api/auth/me');
    return res.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}

export interface RegisterPayload {
  name: string;
  householdName: string;
  email: string;
  password: string;
  language?: string;
}

export interface RegisterResponse {
  ok: boolean;
  account: {
    householdId: string;
    userId: string;
    email: string;
  };
}

export async function registerAccount(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      language: 'pt-BR',
      ...payload,
    }),
  });
}

