export type QuoteStatus = 'Zaakceptowana' | 'Wysłana' | 'Wersja robocza';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface QuoteItem {
  id: string;
  client: string;
  boxType: string;
  dimensions: Dimensions;
  quantity: number;
  unitPrice: number;
  status: QuoteStatus;
  date: string;
  notes?: string;
}

// Alias dla kompatybilności wstecznej z api
export type Quote = QuoteItem;
