import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({ selector: 'app-venta-detalle', imports: [RouterLink, CurrencyPipe, DatePipe], templateUrl: './venta-detalle.html', styleUrl: './venta-detalle.css' })
export class VentaDetalle implements OnInit {
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  readonly id = input.required<string>();
  readonly nueva = input<string>();
  readonly imprimir = input<string>();
  protected readonly venta = signal<Venta | null>(null);
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly fechaImpresion = new Date();
  protected readonly numero = computed(() => String(this.venta()?.id ?? '').padStart(6, '0'));
  protected readonly unidades = computed(() => (this.venta()?.detalles ?? []).reduce((sum, d) => sum + d.cantidad, 0));

  ngOnInit(): void {
    this.ventaService.obtener(Number(this.id())).pipe(
      switchMap((venta) => this.clienteService.obtener(venta.clienteId).pipe(catchError(() => of(null)), map((cliente) => ({ venta, cliente })))),
    ).subscribe({
      next: ({ venta, cliente }) => { this.venta.set(venta); this.cliente.set(cliente); if (this.imprimir()) setTimeout(() => window.print(), 300); },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
  protected imprimirComprobante(): void { window.print(); }
}
