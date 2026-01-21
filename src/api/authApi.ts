import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  userId: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  accessToken: string;
  userId: string;
}

export const authApi = {
  login: async (req: LoginRequest): Promise<LoginResponse> => {
    return await apiClient.post<LoginResponse>('/auth/login', req);
  },
  register: async (req: RegisterRequest): Promise<RegisterResponse> => {
    return await apiClient.post<RegisterResponse>('/auth/register', req);
  },
};
