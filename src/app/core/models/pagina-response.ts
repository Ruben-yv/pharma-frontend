export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

/** Parámetros compartidos para consultar listados paginados. */
export interface ConsultaPagina {
  pagina: number;
  tamanio: number;
  ordenarPor: string;
  direccion: 'asc' | 'desc';
}
