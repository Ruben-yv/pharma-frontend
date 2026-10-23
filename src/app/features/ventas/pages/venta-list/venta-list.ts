import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({ selector: 'app-venta-list', imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SiPermiso], templateUrl: './venta-list.html', styleUrl: './venta-list.css' })
export class VentaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly resultado = signal<PaginaResponse<Venta> | null>(null);
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtros = this.fb.group({ clienteId: this.fb.control<number | null>(null), estado: this.fb.control<EstadoVenta | null>(null), desde: this.fb.control(''), hasta: this.fb.control('') });
  protected readonly ahora = signal(new Date());
  protected readonly totalPagina = computed(() => (this.resultado()?.contenido ?? []).filter((v) => v.estado === 'REGISTRADA').reduce((sum, v) => sum + Number(v.total), 0));

  ngOnInit(): void {
    this.clienteService.listar(0, 100).subscribe({ next: (r) => this.clientes.set((Array.isArray(r) ? r : r.contenido).filter((c) => c.estado)), error: (e: HttpErrorResponse) => this.error.set(mensajeError(e)) });
    this.cargar();
  }
  protected resumenFiltros(): string {
    const f = this.filtros.getRawValue();
    const c = this.clientes().find((item) => item.id === f.clienteId);
    return [c ? `cliente ${c.apellidos}, ${c.nombres}` : '', f.estado ? `estado ${f.estado}` : '', f.desde ? `desde ${f.desde}` : '', f.hasta ? `hasta ${f.hasta}` : ''].filter(Boolean).join(' · ') || 'ninguno (todas las ventas)';
  }
  protected imprimirConsulta(): void { this.ahora.set(new Date()); setTimeout(() => window.print()); }
  protected buscar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) { this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».'); return; }
    this.pagina.set(0); this.cargar();
  }
  protected limpiar(): void { this.filtros.reset(); this.buscar(); }
  protected irA(pagina: number): void { this.pagina.set(pagina); this.cargar(); }
  private cargar(): void {
    const raw = this.filtros.getRawValue();
    const filtro: FiltroVentas = { clienteId: raw.clienteId, estado: raw.estado, desde: raw.desde || null, hasta: raw.hasta || null };
    this.cargando.set(true); this.error.set(null);
    this.ventaService.buscar(filtro, this.pagina(), 10).subscribe({ next: (r) => { this.resultado.set(r); this.cargando.set(false); }, error: (e: HttpErrorResponse) => { this.error.set(mensajeError(e)); this.cargando.set(false); } });
  }
}
