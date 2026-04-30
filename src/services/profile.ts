import { apiFetch } from '@/lib/apiClient';

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
  return apiFetch<ProfileDto>('/api/profile');
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

  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Imagem inválida. Use JPG, PNG ou WEBP com até 5MB.');
    }
    if (response.status === 401) {
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
    throw new Error('Não foi possível enviar sua imagem agora. Tente novamente.');
  }

  return response.json() as Promise<{ avatarUrl: string }>;
}
