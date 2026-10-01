import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente-service';
import { Cliente } from '../../models/cliente.model';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({ selector: 'app-cliente-list', standalone: true, imports: [RouterLink], templateUrl: './cliente-list.html', styleUrl: './cliente-list.css' })
export class ClienteList implements OnInit {
  private readonly service = inject(ClienteService);
  readonly clientes = signal<Cliente[]>([]);
  readonly pagina = signal(0);
  readonly tamanio = signal(10);
  readonly ordenarPor = signal<'dni' | 'apellidos'>('apellidos');
  readonly direccion = signal<'asc' | 'desc'>('asc');
  readonly datosPagina = signal<PaginaResponse<Cliente> | null>(null);
  readonly cargando = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLocaleLowerCase();
    return this.clientes().filter(c => `${c.dni} ${c.nombres} ${c.apellidos}`.toLocaleLowerCase().includes(q));
  });

  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando.set(true); this.errorMsg.set(null);
    this.service.listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion()).subscribe({
      next: data => {
        if (Array.isArray(data)) {
          const ordenados = [...data].sort((a, b) => {
            const valorA = this.ordenarPor() === 'dni' ? a.dni : a.apellidos;
            const valorB = this.ordenarPor() === 'dni' ? b.dni : b.apellidos;
            const resultado = valorA.localeCompare(valorB, 'es', { numeric: true, sensitivity: 'base' });
            return this.direccion() === 'asc' ? resultado : -resultado;
          });
          const totalPaginas = Math.ceil(ordenados.length / this.tamanio());
          this.datosPagina.set({
            contenido: ordenados.slice(this.pagina() * this.tamanio(), (this.pagina() + 1) * this.tamanio()),
            pagina: this.pagina(), tamanio: this.tamanio(), totalElementos: ordenados.length,
            totalPaginas, ultima: totalPaginas === 0 || this.pagina() >= totalPaginas - 1,
          });
        } else {
          this.datosPagina.set(data);
        }
        this.clientes.set(this.datosPagina()?.contenido ?? []);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => { this.errorMsg.set(mensajeError(e)); this.cargando.set(false); },
    });
  }
  cambiarPagina(delta: number): void { this.pagina.update(p => p + delta); this.cargar(); }
  cambiarTamanio(value: string): void { this.tamanio.set(Number(value)); this.pagina.set(0); this.cargar(); }
  ordenar(campo: 'dni' | 'apellidos'): void {
    if (this.ordenarPor() === campo) this.direccion.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.ordenarPor.set(campo); this.direccion.set('asc'); }
    this.pagina.set(0); this.cargar();
  }
  darDeBaja(cliente: Cliente): void {
    if (!cliente.estado || !confirm(`¿Deseas dar de baja a ${cliente.nombres} ${cliente.apellidos}?`)) return;
    this.service.eliminar(cliente.id).subscribe({ next: () => this.cargar(), error: (e: HttpErrorResponse) => this.errorMsg.set(mensajeError(e)) });
  }
}
