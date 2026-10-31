export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type BoxType = 'flap' | 'die_cut' | 'oversized' | 'auto_bottom' | string;
export type FluteType = 'B' | 'C' | 'E' | 'BC' | string;

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface QuoteItemIn {
  productId: number;
  quantity: number;
  unitPrice?: number | null;
  notes?: string | null;
}

export interface QuoteIn {
  clientId: number;
  status?: QuoteStatus;
  quoteDate?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  items: QuoteItemIn[];
}

export interface QuoteItemOut {
  id: number;
  productId: number;
  productName: string;
  boxType: BoxType;
  flute: FluteType;
  dimensions: Dimensions;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  lineTotal: number;
}

export interface QuoteListItem {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  status: QuoteStatus;
  quoteDate: string;
  validUntil?: string | null;
  itemsCount: number;
  totalValue: number;
}

export interface QuoteDetail {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  status: QuoteStatus;
  quoteDate: string;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuoteItemOut[];
  totalValue: number;
}