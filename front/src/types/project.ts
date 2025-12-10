export type ProjectStatus = 1 | 2 | 3 | 4;

export interface Project {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion?: string | null;
  fechaInicio: string;           
  fechaFin?: string | null;
  estado: ProjectStatus;
  horasEstimadasMensuales?: number | null;
  horasEstimadasTotales?: number | null;
}
