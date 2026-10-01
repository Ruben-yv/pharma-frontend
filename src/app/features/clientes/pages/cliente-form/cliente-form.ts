import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';
import { ClienteRequest } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';

@Component({ selector: 'app-cliente-form', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './cliente-form.html', styleUrl: './cliente-form.css' })
export class ClienteForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly service = inject(ClienteService);
  readonly id = input<string>();
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly erroresServidor = signal<Record<string, string>>({});
  readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.pattern(/^\d{9}$/)]],
    direccion: ['', [Validators.maxLength(250)]],
    estado: [true],
  });

  ngOnInit(): void {
    const rawId = this.id(); if (!rawId) return;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) { this.errorMsg.set('No se encontró el cliente. El identificador no es válido.'); return; }
    this.cargando.set(true);
    this.service.obtener(id).subscribe({
      next: c => { this.form.patchValue({ dni:c.dni, nombres:c.nombres, apellidos:c.apellidos, email:c.email, telefono:c.telefono ?? '', direccion:c.direccion ?? '', estado:c.estado }); this.cargando.set(false); },
      error: (e: HttpErrorResponse) => { this.errorMsg.set(mensajeError(e)); this.cargando.set(false); },
    });
  }

  guardar(): void {
    this.errorMsg.set(null); this.erroresServidor.set({}); this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando()) return;
    const v = this.form.getRawValue();
    const dto: ClienteRequest = { dni:v.dni.trim(), nombres:v.nombres.trim(), apellidos:v.apellidos.trim(), email:v.email.trim(), telefono:v.telefono.trim() || null, direccion:v.direccion.trim() || null, estado:v.estado };
    this.guardando.set(true);
    const rawId = this.id();
    const request = rawId ? this.service.actualizar(Number(rawId), dto) : this.service.crear(dto);
    request.subscribe({ next: () => this.router.navigate(['/clientes']), error: (e: HttpErrorResponse) => { this.errorMsg.set(mensajeError(e)); this.erroresServidor.set(erroresDeValidacion(e)); this.guardando.set(false); } });
  }
}
