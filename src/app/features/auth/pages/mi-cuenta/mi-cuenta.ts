import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth-service';
import { PerfilUsuario, Permiso } from '../../../../core/auth/auth.model';
import { mensajeError } from '../../../../core/utils/http-error';

interface GrupoPermisos {
  modulo: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly grupos: GrupoPermisos[] = [
    { modulo: 'Catálogo', permisos: ['CATALOGO_LEER', 'CATALOGO_ESCRIBIR'] },
    { modulo: 'Clientes', permisos: ['CLIENTES_LEER', 'CLIENTES_ESCRIBIR'] },
    { modulo: 'Ventas', permisos: ['VENTAS_LEER', 'VENTAS_REGISTRAR'] },
    { modulo: 'Reportes', permisos: ['REPORTES_VER'] },
    { modulo: 'Usuarios', permisos: ['USUARIOS_ADMINISTRAR'] },
  ];
  protected readonly permisosDifieren = computed(() => {
    const servidor = this.perfil()?.permisos;
    const sesion = this.auth.sesion()?.permisos;
    if (!servidor || !sesion) return false;
    return [...servidor].sort().join('|') !== [...sesion].sort().join('|');
  });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  protected cargarPerfil(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.auth.obtenerPerfil().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected tienePermiso(permiso: Permiso): boolean {
    return this.perfil()?.permisos.includes(permiso) ?? false;
  }

  protected nombreCompleto(perfil: PerfilUsuario): string {
    return perfil.empleadoNombre || perfil.nombreCompleto || perfil.username;
  }
}
