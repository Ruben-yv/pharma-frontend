import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  readonly categoriaId = input<string>();

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<OrdenProducto>('nombre');
  protected readonly direccion = signal<Direccion>('asc');
  private readonly productosApi = signal<Producto[]>([]);
  protected readonly resultado = computed<PaginaResponse<Producto> | null>(() => {
    const categoriaId = this.categoriaFiltro();
    const orden = this.ordenarPor();
    const multiplicador = this.direccion() === 'asc' ? 1 : -1;
    const filtrados = this.productosApi()
      .filter((producto) => categoriaId === null || producto.categoriaId === categoriaId)
      .sort((a, b) => {
        const comparacion = orden === 'nombre'
          ? a.nombre.localeCompare(b.nombre, 'es')
          : a[orden] - b[orden];
        return comparacion * multiplicador;
      });
    const tamanio = this.tamanio();
    const totalElementos = filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamanio));
    const pagina = Math.min(this.pagina(), totalPaginas - 1);
    const inicio = pagina * tamanio;

    return {
      contenido: filtrados.slice(inicio, inicio + tamanio),
      pagina,
      tamanio,
      totalElementos,
      totalPaginas,
      ultima: pagina >= totalPaginas - 1,
    };
  });
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly filtroDesdeCategoria = signal(false);
  protected readonly nombreCategoriaFiltro = computed(() => {
    const id = this.categoriaFiltro();
    if (id === null) return '';
    return this.categorias().find((categoria) => categoria.id === id)?.nombre ?? `ID ${id}`;
  });
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly productos = computed(() => this.resultado()?.contenido ?? []);

  ngOnInit(): void {
    const queryCategoriaId = this.categoriaId();
    const categoriaId = Number(queryCategoriaId);
    if (queryCategoriaId && Number.isInteger(categoriaId) && categoriaId > 0) {
      this.categoriaFiltro.set(categoriaId);
      this.tamanio.set(100);
      this.filtroDesdeCategoria.set(true);
    }

    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productosApi.set(productos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  irA(pagina: number): void {
    this.pagina.set(pagina);
  }

  cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));
    this.pagina.set(0);
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update((direccion) => (direccion === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.pagina.set(0);
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaFiltro.set(valor ? Number(valor) : null);
    this.pagina.set(0);
  }

  darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) return;
    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
