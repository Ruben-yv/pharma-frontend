import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { mensajeError } from '../../../core/utils/http-error';
import { VentaPorCategoria } from '../../ventas/models/venta.model';

@Component({ selector: 'app-ventas-categoria', imports: [ReactiveFormsModule, CurrencyPipe], templateUrl: './ventas-categoria.html', styleUrl: './ventas-categoria.css' })
export class VentasCategoria implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly url = `${environment.apiUrl}/v1/reportes/ventas-por-categoria`;
  protected readonly filtros = this.fb.group({ desde: this.fb.control(''), hasta: this.fb.control('') });
  protected readonly datos = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = computed(() => this.datos().reduce((sum, row) => sum + Number(row.montoTotal), 0));
  protected readonly unidades = computed(() => this.datos().reduce((sum, row) => sum + Number(row.cantidadVendida), 0));
  ngOnInit(): void { this.cargar(); }
  protected buscar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) { this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».'); return; }
    this.cargar();
  }
  protected limpiar(): void { this.filtros.reset(); this.cargar(); }
  protected imprimir(): void { window.print(); }
  private cargar(): void {
    const { desde, hasta } = this.filtros.getRawValue();
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    this.cargando.set(true); this.error.set(null);
    this.http.get<VentaPorCategoria[]>(this.url, { params }).subscribe({ next: (data) => { this.datos.set(data); this.cargando.set(false); }, error: (e: HttpErrorResponse) => { this.error.set(mensajeError(e)); this.cargando.set(false); } });
  }
}
