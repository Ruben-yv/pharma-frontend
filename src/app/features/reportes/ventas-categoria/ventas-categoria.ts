import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { mensajeError } from '../../../core/utils/http-error';
import { VentaPorCategoria } from '../models/reporte.model';
import { ReporteService } from '../services/reporte-service';

@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class VentasCategoria implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly filtros = this.fb.group({ desde: this.fb.control(''), hasta: this.fb.control('') });
  protected readonly datos = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = computed(() => this.datos().reduce((suma, fila) => suma + Number(fila.montoTotal), 0));
  protected readonly unidades = computed(() => this.datos().reduce((suma, fila) => suma + Number(fila.cantidadVendida), 0));
  protected readonly maximoMonto = computed(() => Math.max(0, ...this.datos().map((fila) => Number(fila.montoTotal))));

  ngOnInit(): void {
    this.generar();
  }

  protected generar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «Desde» no puede ser posterior a «Hasta».');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);
    this.reporteService.ventasPorCategoria(desde, hasta).subscribe({
      next: (filas) => {
        this.datos.set(filas);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected limpiar(): void {
    this.filtros.reset();
    this.generar();
  }

  protected anchoBarra(monto: number): number {
    const maximo = this.maximoMonto();
    return maximo > 0 ? (Number(monto) / maximo) * 100 : 0;
  }

  protected imprimir(): void {
    window.print();
  }
}
