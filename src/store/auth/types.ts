export interface AuthSession {
  accessToken: string;
  userId: string;
}

export interface AuthState {
  session: AuthSession | null;
  hasHydrated: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  markHydrated: () => void;
}
