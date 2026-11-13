import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.html',
  styleUrl: './paginador.css',
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalElementos = input.required<number>();
  readonly tamanio = input.required<number>();
  readonly tamanios = input<number[]>([10, 20, 50]);

  readonly cambioPagina = output<number>();
  readonly cambioTamanio = output<number>();

  protected readonly desde = computed(() =>
    this.totalElementos() === 0 ? 0 : this.pagina() * this.tamanio() + 1,
  );
  protected readonly hasta = computed(() =>
    Math.min((this.pagina() + 1) * this.tamanio(), this.totalElementos()),
  );
  protected readonly esPrimera = computed(() => this.pagina() === 0);
  protected readonly esUltima = computed(
    () => this.totalPaginas() === 0 || this.pagina() >= this.totalPaginas() - 1,
  );

  protected ir(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginas() && pagina !== this.pagina()) {
      this.cambioPagina.emit(pagina);
    }
  }

  protected cambiarTamanio(event: Event): void {
    const tamanio = Number((event.target as HTMLSelectElement).value);
    if (Number.isInteger(tamanio) && tamanio > 0 && tamanio !== this.tamanio()) {
      this.cambioTamanio.emit(tamanio);
    }
  }
}
