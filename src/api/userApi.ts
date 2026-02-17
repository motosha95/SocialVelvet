import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';

const getAuthToken = (): string | undefined => {
  const session = useAuthStore.getState().session;
  return session?.accessToken;
};

export type VipTier = null | 'vip' | 'vip_plus';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  points?: number;
  vipTier?: VipTier;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.get<UserProfile>('/users/me', token);
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.patch<UserProfile>('/users/me', data, token);
  },

  updateSubscription: async (tier: VipTier): Promise<UserProfile> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.patch<UserProfile>('/users/me/subscription', { tier }, token);
  },
};
