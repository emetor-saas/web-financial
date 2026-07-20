import { apiFetch, apiFormFetch, getApiUrl } from '@/lib/apiClient';

export type CrestStyle = 'classic' | 'modern' | 'nature' | 'royal' | 'minimal' | 'upload';

export type FamilyCrest = {
  url: string;
  fileName: string;
  style: CrestStyle;
  motto?: string | null;
  generatedAt: string;
  generationCount: number;
};

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export type FamilyAchievement = {
  id: string;
  title: string;
  description: string;
  xp: number;
  tier: AchievementTier;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type FamilyGamification = {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpInLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  unlockedCount: number;
  totalCount: number;
};

export type FamilyMember = {
  id: string;
  name: string;
  avatar: string | null;
};

export type FamilyOverview = {
  householdName: string;
  memberCount: number;
  members: FamilyMember[];
  auraScore: number;
  auraBand: string;
  crest: FamilyCrest | null;
  crestGenerationsRemaining: number;
  crestMaxGenerations: number;
  achievements: FamilyAchievement[];
  gamification: FamilyGamification;
  foundedAt: string;
};

export type GenerateCrestResult = {
  crest: FamilyCrest;
  generationsRemaining: number;
};

function withAbsoluteMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return getApiUrl(url);
}

function withAbsoluteCrestUrl<T extends { crest: FamilyCrest | null }>(data: T): T {
  if (!data.crest?.url) return data;
  return {
    ...data,
    crest: {
      ...data.crest,
      url: getApiUrl(data.crest.url),
    },
  };
}

export async function fetchFamilyOverview(): Promise<FamilyOverview> {
  const data = await apiFetch<FamilyOverview>('/api/family');
  return {
    ...withAbsoluteCrestUrl(data),
    members: data.members.map((m) => ({
      ...m,
      avatar: withAbsoluteMediaUrl(m.avatar),
    })),
  };
}

export async function generateFamilyCrest(input: {
  style: CrestStyle;
  symbols?: string[];
  motto?: string;
}): Promise<GenerateCrestResult> {
  const result = await apiFetch<GenerateCrestResult>('/api/family/crest/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return withAbsoluteCrestUrl(result);
}

export async function uploadFamilyCrest(input: {
  file: File;
  motto?: string;
}): Promise<{ crest: FamilyCrest }> {
  const formData = new FormData();
  formData.append('file', input.file);
  if (input.motto?.trim()) {
    formData.append('motto', input.motto.trim());
  }

  const result = await apiFormFetch<{ crest: FamilyCrest }>('/api/family/crest/upload', formData);
  return withAbsoluteCrestUrl(result);
}

export const CREST_STYLES: { id: Exclude<CrestStyle, 'upload'>; label: string; description: string }[] = [
  { id: 'classic', label: 'Clássico', description: 'Heráldico tradicional com bordas douradas' },
  { id: 'modern', label: 'Moderno', description: 'Linhas geométricas e visual contemporâneo' },
  { id: 'nature', label: 'Natureza', description: 'Formas orgânicas e tons terrosos' },
  { id: 'royal', label: 'Real', description: 'Majestoso, com coroa e cores profundas' },
  { id: 'minimal', label: 'Minimal', description: 'Símbolo único, elegante e limpo' },
];

export const SYMBOL_OPTIONS = [
  'Casa & lar',
  'Prosperidade',
  'União do casal',
  'Filhos',
  'Educação',
  'Viagem',
  'Investimentos',
  'Reserva de emergência',
];

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'from-amber-700/80 to-amber-900/80 border-amber-600/50',
  silver: 'from-slate-400/80 to-slate-600/80 border-slate-400/50',
  gold: 'from-yellow-500/80 to-amber-600/80 border-yellow-500/50',
  legendary: 'from-primary/80 to-primary border-primary/50',
};
