import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Paginador } from '../../../../shared/components/paginador/paginador';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto-service';

function direccionSegura(valor: unknown): Direccion {
  return valor === 'desc' ? 'desc' : 'asc';
}

function ordenSeguro(valor: unknown): OrdenProducto {
  return valor === 'precio' || valor === 'stock' || valor === 'id' ? valor : 'nombre';
}

function paginaSegura(valor: unknown): number {
  return Math.max(0, numberAttribute(valor, 0));
}

function tamanioSeguro(valor: unknown): number {
  const tamanio = numberAttribute(valor, 20);
  return [10, 20, 50].includes(tamanio) ? tamanio : 20;
}

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe, SiPermiso, Paginador],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);

  readonly categoriaId = input<string>();
  readonly pagina = input(0, { transform: paginaSegura });
  readonly tamanio = input(20, { transform: tamanioSeguro });
  readonly orden = input('nombre', { transform: ordenSeguro });
  readonly dir = input<Direccion, unknown>('asc', { transform: direccionSegura });

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriasActivas = computed(() => this.categorias().filter((categoria) => categoria.estado));
  protected readonly categoriaFiltro = signal<number | null>(null);
  private readonly errorLocal = signal<string | null>(null);
  protected readonly productos = rxResource({
    params: () => ({
      pagina: this.pagina(),
      tamanio: this.tamanio(),
      ordenarPor: this.orden(),
      direccion: this.dir(),
    }),
    stream: ({ params }) => this.productoService.listar(params),
  });

  protected readonly pag = linkedSignal<
    PaginaResponse<Producto> | undefined,
    PaginaResponse<Producto> | undefined
  >({
    source: () => this.productos.hasValue() ? this.productos.value() : undefined,
    computation: (nueva, previa) => nueva ?? previa?.value,
  });
  protected readonly cargando = this.productos.isLoading;
  protected readonly error = computed(() => {
    const err = this.productos.error();
    if (err) return err instanceof HttpErrorResponse ? mensajeError(err) : 'No se pudieron cargar los productos.';
    return this.errorLocal();
  });
  protected readonly productosFiltrados = computed(() => {
    const categoriaId = this.categoriaFiltro();
    const contenido = this.pag()?.contenido ?? [];
    return categoriaId === null ? contenido : contenido.filter((producto) => producto.categoriaId === categoriaId);
  });

  ngOnInit(): void {
    const rawCategoriaId = this.categoriaId();
    const categoriaId = Number(rawCategoriaId);
    if (rawCategoriaId && Number.isInteger(categoriaId) && categoriaId > 0) {
      this.categoriaFiltro.set(categoriaId);
    }

    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (err: HttpErrorResponse) => this.errorLocal.set(mensajeError(err)),
    });
  }

  irA(pagina: number): void {
    this.navegar({ pagina });
  }

  cambiarTamanio(tamanio: number): void {
    this.navegar({ tamanio, pagina: 0 });
  }

  ordenar(campo: OrdenProducto): void {
    const dir = this.orden() === campo && this.dir() === 'asc' ? 'desc' : 'asc';
    this.navegar({ orden: campo, dir, pagina: 0 });
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaFiltro.set(valor ? Number(valor) : null);
  }

  darDeBaja(producto: Producto): void {
    if (!confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) return;
    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => this.productos.reload(),
      error: (err: HttpErrorResponse) => this.errorLocal.set(mensajeError(err)),
    });
  }

  private navegar(cambios: Record<string, string | number>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }
}
