export interface Company {
  id: number;
  razonSocial: string;
  nombreFantasia?: string;
  cuit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activa: boolean;
  fechaAlta: string; 
}
