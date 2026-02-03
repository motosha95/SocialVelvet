import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';

const getAuthToken = (): string | undefined => {
  const session = useAuthStore.getState().session;
  return session?.accessToken;
};

export interface GetFollowingResponse {
  followingIds: string[];
}

export interface CheckFollowingResponse {
  following: boolean;
}

export const followApi = {
  /** Get list of user IDs the current user follows */
  getFollowing: async (): Promise<string[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiClient.get<GetFollowingResponse>('/users/me/following', token);
    return res.followingIds;
  },

  /** Check if current user follows the given user */
  isFollowing: async (userId: string): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;
    const res = await apiClient.get<CheckFollowingResponse>(`/users/${userId}/following/check`, token);
    return res.following;
  },

  /** Follow a user */
  follow: async (userId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    await apiClient.post(`/users/${userId}/follow`, {}, token);
  },

  /** Unfollow a user */
  unfollow: async (userId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    await apiClient.delete(`/users/${userId}/follow`, token);
  },
};
