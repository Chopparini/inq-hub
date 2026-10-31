import { QuoteItem, QuoteStatus } from '../types/quote';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ClientOption {
  id: number;
  name: string;
}

export interface ProductOption {
  id: number;
  name: string;
  defaultPrice?: number;
}

export interface FullQuotePayload {
  clientId: number | string;
  productId: number | string;
  quantity: number | string;
  unitPrice?: number | string;
  status?: QuoteStatus;
  notes?: string;
}

function mapStatusToApi(status?: QuoteStatus): string {
  switch (status) {
    case 'Zaakceptowana': return 'accepted';
    case 'Wysłana': return 'sent';
    case 'Wersja robocza':
    default: return 'draft';
  }
}

function mapStatusFromApi(status: any): QuoteStatus {
  const s = String(status || '').toLowerCase();
  if (s === 'accepted' || s === 'zaakceptowana') return 'Zaakceptowana';
  if (s === 'sent' || s === 'wyslana' || s === 'wysłana') return 'Wysłana';
  return 'Wersja robocza';
}

function normalizeQuote(raw: any): QuoteItem & { numericId: number; number: string } {
  const numId = Number(raw.id || 1);
  const numStr = String(raw.number || `WYC-${numId}`);

  return {
    id: String(numId),
    numericId: numId,
    number: numStr,
    client: raw.clientName || raw.client_name || `Klient ${raw.clientId || raw.client_id || ''}`,
    boxType: raw.itemsCount ? `${raw.itemsCount} poz.` : '1 poz.',
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    quantity: raw.itemsCount ?? 1,
    unitPrice: Number(raw.totalValue ?? raw.total_value ?? 0),
    status: mapStatusFromApi(raw.status),
    date: raw.quoteDate || raw.quote_date || new Date().toISOString().split('T')[0],
    notes: raw.notes || '',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `Błąd serwera (${response.status})`;
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.errors)) {
        errorDetail = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
      } else if (typeof errorData.detail === 'string') {
        errorDetail = errorData.detail;
      }
    } catch {
      if (response.status === 400) errorDetail = 'Niepoprawne dane (400 Bad Request).';
      if (response.status === 404) errorDetail = 'Nie odnaleziono zasobu (404).';
    }
    throw new Error(errorDetail);
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

export const quotesApi = {
  async getQuotes(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/quotes`);
    const rawData = await handleResponse<any>(res);
    const list = Array.isArray(rawData) ? rawData : rawData.items || [];
    return list.map(normalizeQuote);
  },

  async getQuoteDetail(id: number | string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/quotes/${Number(id)}`);
    return handleResponse<any>(res);
  },

  async getClients(): Promise<ClientOption[]> {
    const res = await fetch(`${API_BASE_URL}/clients`);
    const data = await handleResponse<any>(res);
    const list = Array.isArray(data) ? data : data.items || [];
    return list.map((c: any) => ({
      id: parseInt(c.id ?? c.clientId, 10),
      name: c.name ?? c.clientName ?? `Klient ${c.id}`,
    }));
  },

  async getProducts(): Promise<ProductOption[]> {
    const res = await fetch(`${API_BASE_URL}/products`);
    const data = await handleResponse<any>(res);
    const list = Array.isArray(data) ? data : data.items || [];
    return list.map((p: any) => ({
      id: parseInt(p.id ?? p.productId, 10),
      name: p.name ?? p.productName ?? `Produkt ${p.id}`,
      defaultPrice: p.defaultPrice ?? p.default_price ?? p.unitPrice ?? 1.5,
    }));
  },

  async createQuote(payload: FullQuotePayload): Promise<any> {
    const body = {
      clientId: parseInt(String(payload.clientId), 10),
      status: mapStatusToApi(payload.status),
      notes: payload.notes || 'Wycena utworzona z interfejsu WWW',
      items: [
        {
          productId: parseInt(String(payload.productId), 10),
          quantity: parseInt(String(payload.quantity), 10),
          unitPrice: payload.unitPrice ? parseFloat(String(payload.unitPrice)) : undefined,
        }
      ]
    };

    const res = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await handleResponse<any>(res);
    return normalizeQuote(result);
  },

  async updateQuote(numericId: number | string, payload: FullQuotePayload): Promise<void> {
    const body = {
      clientId: parseInt(String(payload.clientId), 10),
      status: mapStatusToApi(payload.status),
      notes: payload.notes ?? '',
      items: [
        {
          productId: parseInt(String(payload.productId), 10),
          quantity: parseInt(String(payload.quantity), 10),
          unitPrice: payload.unitPrice ? parseFloat(String(payload.unitPrice)) : undefined,
        }
      ]
    };

    const res = await fetch(`${API_BASE_URL}/quotes/${Number(numericId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse<void>(res);
  },

  async deleteQuote(numericId: number | string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/quotes/${Number(numericId)}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};