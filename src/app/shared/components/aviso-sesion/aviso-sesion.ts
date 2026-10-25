import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-aviso-sesion',
  standalone: true,
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css',
})
export class AvisoSesion {
  protected readonly auth = inject(AuthService);
  protected readonly cuentaRegresiva = computed(() => {
    const segundos = this.auth.segundosRestantes();
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
  });

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }

  protected ocultar(): void {
    this.auth.ocultarAviso();
  }
}
