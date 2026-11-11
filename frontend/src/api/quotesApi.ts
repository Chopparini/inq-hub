import { QuoteListItem, QuoteDetail, QuoteIn } from '../types/quote';
import { API_BASE_URL, handleResponse } from './client';

export interface ClientOption {
  id: number;
  name: string;
}

export interface ProductOption {
  id: number;
  name: string;
  defaultPrice?: number;
}


export const quotesApi = {
  async getQuotes(): Promise<QuoteListItem[]> {
    // Opóźnienie 800ms dla płynnego stanu ładowania w interfejsie
    await new Promise((r) => setTimeout(r, 800));
    const res = await fetch(`${API_BASE_URL}/quotes`);
    return handleResponse<QuoteListItem[]>(res);
  },

  async getQuote(quoteId: number): Promise<QuoteDetail> {
    const res = await fetch(`${API_BASE_URL}/quotes/${quoteId}`);
    return handleResponse<QuoteDetail>(res);
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
      defaultPrice: p.defaultPrice ?? p.default_price ?? p.unitPrice ?? null,
    }));
  },

  async createQuote(payload: QuoteIn): Promise<QuoteDetail> {
    const res = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<QuoteDetail>(res);
  },

  async updateQuote(quoteId: number, payload: QuoteIn): Promise<QuoteDetail> {
    const res = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<QuoteDetail>(res);
  },

  async deleteQuote(quoteId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};