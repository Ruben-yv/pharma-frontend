export interface Cliente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
  creadoPor: string | null;
  modificadoPor: string | null;
}

export interface ClienteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
}
