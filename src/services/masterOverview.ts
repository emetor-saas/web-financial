import { apiFetch } from '@/lib/apiClient';

export interface MasterOverviewMetrics {
  tenantsTotal: number;
  activeTenants: number;
  inactiveTenants: number;
  delinquentTenants: number;
  mrr: number;
  arr: number;
  arpa: number;
  churnRate: number;
}

export interface MasterOverviewOperational {
  importFailures30d: number;
  aiMessagesMonth: number;
  aiCostMonth: number;
}

export interface MasterTenantRow {
  id: string;
  name: string;
  planCode: string;
  isActive: boolean;
  subscriptionStatus: string;
  delinquentSince: string | null;
  usersCount: number;
  seatUsage: string;
  pendingInvites: number;
  lastActiveAt: string | null;
  createdAt: string;
  mrr: number;
  latestInvoice: {
    status: string;
    amountPaid: number | null;
    amountDue: number | null;
    createdAt: string;
  } | null;
  failedImports30d: number;
  aiMessagesMonth: number;
  aiCostMonth: number;
  healthScore: number;
}

export interface MasterOverviewPayload {
  metrics: MasterOverviewMetrics;
  operational: MasterOverviewOperational;
  tenants: MasterTenantRow[];
}

export async function fetchMasterOverview(): Promise<MasterOverviewPayload> {
  return apiFetch<MasterOverviewPayload>('/api/master/overview');
}
