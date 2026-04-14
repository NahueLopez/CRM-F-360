export interface Company {
  id: number;
  name: string;
  cuit?: string;
  email?: string;
  phone?: string;
  industry?: string;
  website?: string;
  notes?: string;
  clientName?: string;
  commercialAgent?: string;
  status?: string;
  socialMedia?: string;
  followUp?: string;
  location?: string;
  active: boolean;
  createdAt?: string;
}
