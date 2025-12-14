import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { authApi } from '../../api/authApi';
import { storage } from '../../services/storage';
import type { AuthActions, AuthState } from './types';

export type AuthStore = AuthState & AuthActions;

const PERSIST_KEY = 'auth/session/v1';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,
      markHydrated: () => {
        set({ hasHydrated: true });
      },
      signIn: async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        set({ session: { accessToken: res.accessToken, userId: res.userId } });
      },
      signOut: async () => {
        set({ session: null });
      },
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => {
        return (state) => {
          state?.markHydrated();
        };
      },
    }
  )
);
