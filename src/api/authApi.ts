export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: string;
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const authApi = {
  login: async (_req: LoginRequest): Promise<LoginResponse> => {
    // TODO: Replace with real API call.
    await sleep(350);

    return {
      accessToken: 'dev-token',
      userId: 'user_dev',
    };
  },
};
