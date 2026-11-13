import { Client, ClientIn } from '../types/client';
import { API_BASE_URL, authHeaders, handleResponse } from './client';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', ...authHeaders() });

export const clientsApi = {
  async list(): Promise<Client[]> {
    const res = await fetch(`${API_BASE_URL}/clients`, { headers: authHeaders() });
    return handleResponse<Client[]>(res);
  },

  async create(payload: ClientIn): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Client>(res);
  },

  async update(id: number, payload: ClientIn): Promise<Client> {
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Client>(res);
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<void>(res);
  },
};
