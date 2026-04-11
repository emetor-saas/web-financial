import { apiFetch } from '@/lib/apiClient';

export interface CoupleOverview {
  membersCount: number;
  members: { id: string; name: string }[];
  alignmentLevel: 'desalinhado' | 'fragil' | 'razoavel' | 'bom' | 'forte';
  mainTension: string;
  mainDecision: string;
}

export async function fetchCoupleOverview(): Promise<CoupleOverview> {
  return apiFetch<CoupleOverview>('/api/couple/overview');
}

