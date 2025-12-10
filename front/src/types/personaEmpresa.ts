export interface PersonaEmpresa {
  id: number;
  empresaId: number;
  nombreCompleto: string;
  rolEnEmpresa?: string | null;
  email?: string | null;
  telefono?: string | null;
  principal: boolean;
  activa: boolean;
}