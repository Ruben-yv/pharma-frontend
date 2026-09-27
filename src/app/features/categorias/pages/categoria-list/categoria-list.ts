import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoriaService } from '../../services/categoria-service';
import { Categoria } from '../../models/categoria.model';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.css'
})
export class CategoriaList implements OnInit {
  private readonly categoriaService = inject(CategoriaService);

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  errorMsg = signal<string | null>(null);
  busqueda = signal('');
  categoriasFiltradas = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    return this.categorias().filter((categoria) =>
      categoria.nombre.toLocaleLowerCase().includes(termino)
    );
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMsg.set(mensajeError(error));
        this.cargando.set(false);
      }
    });
  }

  eliminar(id: number, nombre: string): void {
    if (confirm(`¿Deseas eliminar la categoría “${nombre}”?`)) {
      this.categoriaService.eliminar(id).subscribe({
        next: () => this.categorias.update((lista) => lista.filter((categoria) => categoria.id !== id)),
        error: (error: HttpErrorResponse) => this.errorMsg.set(mensajeError(error)),
      });
    }
  }
}
