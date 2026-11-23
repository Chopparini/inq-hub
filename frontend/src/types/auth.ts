export type UserRole = 'admin' | 'sales';

export interface User {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UserRole;
}

export interface RegisterIn {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  sales: 'Handlowiec',
};


export function displayName(user: User): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return full || user.username;
}

export function initials(user: User): string {
  if (user.firstName && user.lastName) {
    return (user.firstName[0] + user.lastName[0]).toUpperCase();
  }
  return user.username.slice(0, 2).toUpperCase();
}
