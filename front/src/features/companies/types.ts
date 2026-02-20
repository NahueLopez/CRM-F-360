export interface Company {
  id: number;
  name: string;
  cuit?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active: boolean;
  createdAt?: string;
}