import { apiFetch } from '@/lib/apiClient';

export interface HouseholdUserDto {
  id: string;
  householdId: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchHouseholdUsers(): Promise<HouseholdUserDto[]> {
  return apiFetch<HouseholdUserDto[]>('/api/users');
}
