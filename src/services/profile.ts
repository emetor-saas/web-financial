import { apiFetch } from '@/lib/apiClient';

export interface ProfileDto {
  id: string;
  householdId: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  language: string;
  createdAt: string;
  household: {
    id: string;
    name: string;
  };
}

export interface PatchProfileBody {
  name?: string;
  email?: string;
  avatar?: string | null;
  language?: 'pt-BR' | 'en-US';
  currentPassword?: string;
  newPassword?: string;
}

export async function fetchProfile(): Promise<ProfileDto> {
  return apiFetch<ProfileDto>('/api/profile');
}

export async function patchProfile(body: PatchProfileBody): Promise<ProfileDto> {
  return apiFetch<ProfileDto>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
