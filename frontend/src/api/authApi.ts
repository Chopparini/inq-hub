import { User, RegisterIn } from '../types/auth';
import { API_BASE_URL, authHeaders, handleResponse, tokenStorage } from './client';

export const authApi = {
  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });
    const data = await handleResponse<{ access_token: string }>(res);
    tokenStorage.set(data.access_token);
  },

  async register(payload: RegisterIn): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<User>(res);
  },

  async me(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: authHeaders() });
    return handleResponse<User>(res);
  },

  logout(): void {
    tokenStorage.clear();
  },
};
