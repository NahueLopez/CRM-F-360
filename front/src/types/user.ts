export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  active: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}
