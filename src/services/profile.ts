import { apiFetch, apiFormFetch, getApiUrl } from '@/lib/apiClient';

export interface ProfileDto {
  id: string;
  householdId: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  gender: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | null;
  age: number | null;
  city: string | null;
  phone: string | null;
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
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | null;
  age?: number | null;
  city?: string | null;
  phone?: string | null;
  language?: 'pt-BR' | 'en-US';
  currentPassword?: string;
  newPassword?: string;
}

export async function fetchProfile(): Promise<ProfileDto> {
  const profile = await apiFetch<ProfileDto>('/api/profile');
  return {
    ...profile,
    avatar: profile.avatar ? getApiUrl(profile.avatar) : null,
  };
}

export async function patchProfile(body: PatchProfileBody): Promise<ProfileDto> {
  return apiFetch<ProfileDto>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadProfileAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const result = await apiFormFetch<{ avatarUrl: string }>('/api/profile/avatar', formData);
    return {
      avatarUrl: getApiUrl(result.avatarUrl),
    };
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 400) {
      throw new Error('Imagem inválida. Use JPG, PNG ou WEBP com até 5MB.');
    }
    if (status === 401) {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
    if (err instanceof Error && err.message) throw err;
    throw new Error('Não foi possível enviar sua imagem agora. Tente novamente.');
  }
}
