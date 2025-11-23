import api from './api';
import { User, AuthTokens, APIResponse } from '../types/index';

export const authService = {
  login: async (email: string, password: string, rememberMe = false): Promise<{ user: User, tokens: AuthTokens }> => {
    const { data }: APIResponse<{ user: User; tokens: AuthTokens }> = await api.post('/auth/login', {
      email,
      password,
      rememberMe,
    });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data }: APIResponse<{ tokens: AuthTokens }> = await api.post('/auth/refresh', { refreshToken });
    return data.tokens;
  },

  passwordResetRequest: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset-request', { email });
  },

  passwordReset: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password-reset', { token, newPassword });
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  },
};
