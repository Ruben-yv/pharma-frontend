import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Categoria, CategoriaRequest } from '../models/categoria.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/v1/categorias`;

  listar() {
    return this.http.get<Categoria[]>(this.url);
  }

  obtener(id: number) {
    return this.http.get<Categoria>(`${this.url}/${id}`);
  }

  crear(dto: CategoriaRequest) {
    return this.http.post<Categoria>(this.url, dto);
  }

  actualizar(id: number, dto: CategoriaRequest) {
    return this.http.put<Categoria>(`${this.url}/${id}`, dto);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
