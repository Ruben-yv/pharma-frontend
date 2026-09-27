import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriaService } from '../../services/categoria-service';
import { CategoriaRequest } from '../../models/categoria.model';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-categoria-form',
  styleUrl: './categoria-form.css',
  templateUrl: './categoria-form.html',
})
export class CategoriaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly categoriaService = inject(CategoriaService);

  readonly id = input<string>();
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly erroresServidor = signal<Record<string, string>>({});

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    descripcion: ['', [Validators.maxLength(200)]],
    estado: [true],
  });

  ngOnInit(): void {
    const rawId = this.id();
    if (!rawId) return;

    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMsg.set('No se encontró la categoría (404). El identificador no es válido.');
      return;
    }

    this.cargando.set(true);
    this.categoriaService.obtener(id).subscribe({
      next: (categoria) => {
        this.form.patchValue({
          nombre: categoria.nombre,
          descripcion: categoria.descripcion ?? '',
          estado: categoria.estado ?? true,
        });
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMsg.set(mensajeError(error));
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    this.errorMsg.set(null);
    this.erroresServidor.set({});
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando()) return;

    const value = this.form.getRawValue();
    const request: CategoriaRequest = {
      nombre: value.nombre.trim(),
      descripcion: value.descripcion.trim() || null,
      estado: value.estado,
    };

    this.guardando.set(true);
    const rawId = this.id();
    const request$ = rawId
      ? this.categoriaService.actualizar(Number(rawId), request)
      : this.categoriaService.crear(request);

    request$.subscribe({
      next: () => this.router.navigate(['/categorias']),
      error: (error: HttpErrorResponse) => {
        this.errorMsg.set(mensajeError(error));
        this.erroresServidor.set(erroresDeValidacion(error));
        this.guardando.set(false);
      }
    });
  }
}
