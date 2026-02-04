import { apiClient } from './client';
import { useAuthStore } from '../store/auth/authStore';

const getAuthToken = (): string | undefined => {
  return useAuthStore.getState().session?.accessToken;
};

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  targetCount: number;
  rewardPoints: number;
  currentCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ChallengesStats {
  totalPoints: number;
  totalEventsAttended: number;
  completedChallenges: number;
  totalChallenges: number;
}

export interface ChallengesResponse {
  challenges: Challenge[];
  stats: ChallengesStats;
}

export const challengesApi = {
  getChallenges: async (): Promise<ChallengesResponse> => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    return await apiClient.get<ChallengesResponse>('/users/me/challenges', token);
  },
};
