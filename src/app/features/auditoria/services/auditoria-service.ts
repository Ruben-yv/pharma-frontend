import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { AuditoriaEvento, FiltroAuditoria } from '../models/auditoria-evento.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auditoria`;

  buscar(filtro: FiltroAuditoria, pagina: number, tamanio: number): Observable<PaginaResponse<AuditoriaEvento>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    if (filtro.usuario.trim()) params = params.set('usuario', filtro.usuario.trim());
    if (filtro.accion.trim()) params = params.set('accion', filtro.accion.trim());
    if (filtro.desde) params = params.set('desde', filtro.desde);
    if (filtro.hasta) params = params.set('hasta', filtro.hasta);
    return this.http.get<PaginaResponse<AuditoriaEvento>>(this.url, { params });
  }
}
