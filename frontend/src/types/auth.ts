export type UserRole = 'admin' | 'sales';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface RegisterIn {
  username: string;
  email: string;
  password: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  sales: 'Handlowiec',
};
