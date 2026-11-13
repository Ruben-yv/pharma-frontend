import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  OnInit,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

function clienteIdSeguro(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function estadoVentaSeguro(valor: unknown): EstadoVenta | null {
  return valor === 'REGISTRADA' || valor === 'ANULADA' ? valor : null;
}

function fechaSegura(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function paginaSegura(valor: unknown): number {
  return Math.max(0, numberAttribute(valor, 0));
}

function tamanioSeguro(valor: unknown): number {
  const tamanio = numberAttribute(valor, 10);
  return [10, 20, 50].includes(tamanio) ? tamanio : 10;
}

@Component({
  selector: 'app-venta-list',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css',
})
export class VentaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly pagina = input(0, { transform: paginaSegura });
  readonly tamanio = input(10, { transform: tamanioSeguro });
  readonly clienteId = input<number | null, unknown>(null, { transform: clienteIdSeguro });
  readonly estado = input<EstadoVenta | null, unknown>(null, { transform: estadoVentaSeguro });
  readonly desde = input('', { transform: fechaSegura });
  readonly hasta = input('', { transform: fechaSegura });

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control(''),
    hasta: this.fb.control(''),
  });
  protected readonly ahora = signal(new Date());
  private readonly errorClientes = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.filtros.patchValue(
        {
          clienteId: this.clienteId(),
          estado: this.estado(),
          desde: this.desde(),
          hasta: this.hasta(),
        },
        { emitEvent: false },
      );
    });
  }

  protected readonly ventas = rxResource({
    params: () => ({
      clienteId: this.clienteId(),
      estado: this.estado(),
      desde: this.desde() || null,
      hasta: this.hasta() || null,
      pagina: this.pagina(),
      tamanio: this.tamanio(),
    }),
    stream: ({ params }) => {
      const filtro: FiltroVentas = {
        clienteId: params.clienteId,
        estado: params.estado,
        desde: params.desde,
        hasta: params.hasta,
      };
      return this.ventaService.buscar(filtro, params.pagina, params.tamanio);
    },
  });
  protected readonly pag = linkedSignal<
    PaginaResponse<Venta> | undefined,
    PaginaResponse<Venta> | undefined
  >({
    source: () => this.ventas.hasValue() ? this.ventas.value() : undefined,
    computation: (nueva, previa) => nueva ?? previa?.value,
  });
  protected readonly cargando = this.ventas.isLoading;
  protected readonly error = computed(() => {
    const err = this.ventas.error();
    if (err) return err instanceof HttpErrorResponse ? mensajeError(err) : 'No se pudieron cargar las ventas.';
    return this.errorClientes();
  });
  protected readonly totalPagina = computed(() =>
    (this.pag()?.contenido ?? [])
      .filter((venta) => venta.estado === 'REGISTRADA')
      .reduce((total, venta) => total + Number(venta.total), 0),
  );

  ngOnInit(): void {
    this.clienteService.listar(0, 100).subscribe({
      next: (respuesta) => {
        const clientes = Array.isArray(respuesta) ? respuesta : respuesta.contenido;
        this.clientes.set(clientes.filter((cliente) => cliente.estado));
      },
      error: (err: HttpErrorResponse) => this.errorClientes.set(mensajeError(err)),
    });
  }

  protected resumenFiltros(): string {
    const filtros = this.filtros.getRawValue();
    const cliente = this.clientes().find((item) => item.id === filtros.clienteId);
    return [
      cliente ? `cliente ${cliente.apellidos}, ${cliente.nombres}` : '',
      filtros.estado ? `estado ${filtros.estado}` : '',
      filtros.desde ? `desde ${filtros.desde}` : '',
      filtros.hasta ? `hasta ${filtros.hasta}` : '',
    ].filter(Boolean).join(' · ') || 'ninguno (todas las ventas)';
  }

  protected imprimirConsulta(): void {
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }

  protected buscar(): void {
    const { clienteId, estado, desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.errorClientes.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.errorClientes.set(null);
    this.navegar({ clienteId, estado, desde, hasta, pagina: 0 });
  }

  protected limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  protected irA(pagina: number): void {
    this.navegar({ pagina });
  }

  protected cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  private navegar(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
