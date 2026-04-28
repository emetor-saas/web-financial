import { apiFetch } from '@/lib/apiClient';

export interface CoupleMemberStat {
  userId: string;
  name: string;
  avgMonthlyIncome: number;
  avgMonthlyPersonalExpenses: number;
}

export interface CoupleOverview {
  householdName: string;
  membersCount: number;
  members: { id: string; name: string }[];
  memberStats: CoupleMemberStat[];
  jointAvgMonthlyIncome: number;
  jointAuraScore: number;
  jointAuraBand: string;
  alignmentLevel: 'desalinhado' | 'fragil' | 'razoavel' | 'bom' | 'forte';
  mainTension: string;
  mainDecision: string;
}

export async function fetchCoupleOverview(): Promise<CoupleOverview> {
  return apiFetch<CoupleOverview>('/api/couple/overview');
}

