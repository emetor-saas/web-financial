import { apiFetch } from '@/lib/apiClient';

export interface CoupleMemberStat {
  userId: string;
  name: string;
  avgMonthlyIncome: number;
  avgMonthlyPersonalExpenses: number;
}

export interface CoupleGoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPct: number;
  onTrack: boolean;
  targetDate: string | null;
  isAchieved: boolean;
}

export interface CoupleMemberSpending {
  userId: string;
  name: string;
  total3m: number;
  avgMonthly: number;
}

export interface CoupleOverview {
  householdName: string;
  membersCount: number;
  members: { id: string; name: string }[];
  memberStats: CoupleMemberStat[];
  jointAvgMonthlyIncome: number;
  avgMonthlySharedExpenses: number;
  avgMonthlyPersonalExpenses: number;
  currentMonthExpenses: number;
  monthlySpendingByMember: CoupleMemberSpending[];
  goalsProgress: CoupleGoalProgress[];
  jointAuraScore: number;
  jointAuraBand: string;
  alignmentLevel: 'desalinhado' | 'fragil' | 'razoavel' | 'bom' | 'forte';
  sharedUnattributedAvgMonthly?: number;
  mainTension: string;
  mainDecision: string;
}

export async function fetchCoupleOverview(): Promise<CoupleOverview> {
  return apiFetch<CoupleOverview>('/api/couple/overview');
}

