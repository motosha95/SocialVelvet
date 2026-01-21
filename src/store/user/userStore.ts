import { create } from 'zustand';
import { userApi } from '../../api/userApi';
import type { UserProfile, UpdateProfileRequest } from '../../api/userApi';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  clearProfile: () => void;
}

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userApi.getProfile();
      set({ profile, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load profile',
      });
    }
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userApi.updateProfile(data);
      set({ profile, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update profile',
      });
      throw err;
    }
  },

  clearProfile: () => {
    set({ profile: null });
  },
}));
