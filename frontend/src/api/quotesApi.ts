import initialQuotes from './mockData.json';
import { Quote } from '../types/quote';

// Użycie zmiennej środowiskowej z Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getQuotes = async (): Promise<Quote[]> => {
  // Jeśli backend jeszcze nie działa, zwracamy lokalny mock JSON (E3)
  try {
    const response = await fetch(`${API_BASE_URL}/quotes`);
    if (!response.ok) throw new Error('Backend offline');
    return await response.json();
  } catch {
    // Fallback na dane z mockData.json
    return initialQuotes as Quote[];
  }
};