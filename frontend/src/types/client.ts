export interface ClientIn {
  name: string;
  nip: string;
  email: string;
  phone: string;
  contactPerson: string;
  street: string;
  postalCode: string;
  city: string;
}

export interface Client {
  id: number;
  name: string;
  nip: string | null;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
}
