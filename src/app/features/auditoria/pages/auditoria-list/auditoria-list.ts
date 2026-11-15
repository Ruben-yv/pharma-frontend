import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, input, linkedSignal, numberAttribute, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { AuditoriaEvento, FiltroAuditoria } from '../../models/auditoria-evento.model';
import { AuditoriaService } from '../../services/auditoria-service';

function paginaSegura(value: unknown): number {
  const page = numberAttribute(value, 0);
  return Number.isInteger(page) ? Math.max(0, page) : 0;
}

function tamanioSeguro(value: unknown): number {
  const size = numberAttribute(value, 20);
  return [10, 20, 50].includes(size) ? size : 20;
}

function textoSeguro(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

@Component({
  selector: 'app-auditoria-list',
  imports: [DatePipe, ReactiveFormsModule, Paginador],
  templateUrl: './auditoria-list.html',
  styleUrl: './auditoria-list.css',
})
export class AuditoriaList {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly router = inject(Router);

  readonly usuario = input('', { transform: textoSeguro });
  readonly accion = input('', { transform: textoSeguro });
  readonly desde = input('', { transform: textoSeguro });
  readonly hasta = input('', { transform: textoSeguro });
  readonly pagina = input(0, { transform: paginaSegura });
  readonly tamanio = input(20, { transform: tamanioSeguro });

  protected readonly filtros = this.fb.group({ usuario: '', accion: '', desde: '', hasta: '' });
  private readonly errorFiltro = signal<string | null>(null);

  constructor() {
    effect(() => this.filtros.patchValue({
      usuario: this.usuario(), accion: this.accion(), desde: this.desde(), hasta: this.hasta(),
    }, { emitEvent: false }));
  }

  protected readonly eventos = rxResource({
    params: () => ({
      usuario: this.usuario(), accion: this.accion(), desde: this.desde(), hasta: this.hasta(),
      pagina: this.pagina(), tamanio: this.tamanio(),
    }),
    stream: ({ params }) => {
      const filtro: FiltroAuditoria = {
        usuario: params.usuario, accion: params.accion, desde: params.desde, hasta: params.hasta,
      };
      return this.auditoriaService.buscar(filtro, params.pagina, params.tamanio);
    },
  });

  protected readonly pag = linkedSignal<PaginaResponse<AuditoriaEvento> | undefined, PaginaResponse<AuditoriaEvento> | undefined>({
    source: () => this.eventos.hasValue() ? this.eventos.value() : undefined,
    computation: (nueva, previa) => nueva ?? previa?.value,
  });
  protected readonly cargando = this.eventos.isLoading;
  protected readonly error = computed(() => {
    const err = this.eventos.error();
    return err ? (err instanceof HttpErrorResponse ? mensajeError(err) : 'No se pudo cargar la auditoría.') : this.errorFiltro();
  });

  protected buscar(): void {
    const value = this.filtros.getRawValue();
    if (value.desde && value.hasta && value.desde > value.hasta) {
      this.errorFiltro.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.errorFiltro.set(null);
    void this.router.navigate([], {
      queryParams: { ...value, pagina: 0 }, queryParamsHandling: 'merge',
    });
  }

  protected limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  protected irA(pagina: number): void {
    void this.router.navigate([], { queryParams: { pagina }, queryParamsHandling: 'merge' });
  }

  protected cambiarTamanio(tamanio: number): void {
    void this.router.navigate([], { queryParams: { tamanio, pagina: 0 }, queryParamsHandling: 'merge' });
  }
}
