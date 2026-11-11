export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'inqhub_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export function authHeaders(): Record<string, string> {
  const token = tokenStorage.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `Błąd serwera (${response.status})`;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.errors)) {
        errorDetail = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      } else if (typeof errorData.detail === 'string') {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map((e: any) => e.msg).join(', ');
      }
    } catch {
      if (response.status === 400) errorDetail = 'Niepoprawne dane (400 Bad Request).';
      if (response.status === 404) errorDetail = 'Nie odnaleziono zasobu (404).';
      if (response.status === 500) errorDetail = 'Wewnętrzny błąd serwera (500).';
    }
    throw new Error(errorDetail);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}