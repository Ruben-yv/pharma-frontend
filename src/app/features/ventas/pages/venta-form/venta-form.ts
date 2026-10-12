import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { coincide } from '../../../../core/utils/texto';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { VentaRequest } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

interface LineaForm { productoId: FormControl<number | null>; cantidad: FormControl<number>; }
const MAX_RESULTADOS = 6;

@Component({ selector: 'app-venta-form', imports: [ReactiveFormsModule, RouterLink, CurrencyPipe], templateUrl: './venta-form.html', styleUrl: './venta-form.css' })
export class VentaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventaService = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly confirmando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imprimirAlRegistrar = signal(true);
  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    detalles: new FormArray<FormGroup<LineaForm>>([], Validators.required),
  });
  protected get detalles(): FormArray<FormGroup<LineaForm>> { return this.form.controls.detalles; }
  protected readonly buscarCliente = new FormControl('', { nonNullable: true });
  protected readonly buscarProducto = new FormControl('', { nonNullable: true });
  private readonly textoCliente = toSignal(this.buscarCliente.valueChanges, { initialValue: '' });
  private readonly textoProducto = toSignal(this.buscarProducto.valueChanges, { initialValue: '' });
  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  private readonly productoPorId = computed(() => new Map(this.productos().map((p) => [p.id, p])));
  protected readonly clientesEncontrados = computed(() => {
    const q = this.textoCliente().trim();
    return q ? this.clientes().filter((c) => coincide(q, c.nombres, c.apellidos, c.dni)).slice(0, MAX_RESULTADOS) : [];
  });
  protected readonly productosEncontrados = computed(() => {
    const q = this.textoProducto().trim();
    return q ? this.productos().filter((p) => coincide(q, p.nombre, p.categoriaNombre)).slice(0, MAX_RESULTADOS) : [];
  });
  protected readonly hayBusquedaCliente = computed(() => !!this.textoCliente().trim());
  protected readonly hayBusquedaProducto = computed(() => !!this.textoProducto().trim());
  protected readonly clienteElegido = computed(() => this.clientes().find((c) => c.id === this.valor().clienteId));
  protected readonly lineas = computed(() => (this.valor().detalles ?? []).map((d) => {
    const producto = d.productoId ? this.productoPorId().get(d.productoId) : undefined;
    const cantidad = Number(d.cantidad) || 0;
    const precio = producto?.precio ?? 0;
    return { producto, precio, subtotal: redondear(precio * cantidad), excedeStock: !!producto && cantidad > producto.stock };
  }));
  protected readonly total = computed(() => redondear(this.lineas().reduce((suma, l) => suma + l.subtotal, 0)));
  protected readonly hayExcesoDeStock = computed(() => this.lineas().some((l) => l.excedeStock));

  ngOnInit(): void {
    forkJoin({
      clientes: this.clienteService.listar(0, 100).pipe(map((r) => Array.isArray(r) ? r : r.contenido)),
      productos: this.productoService.listar(0, 100, 'nombre', 'asc').pipe(map((r) => r.contenido)),
    }).subscribe({
      next: ({ clientes, productos }) => {
        this.clientes.set(clientes.filter((c) => c.estado));
        this.productos.set(productos.filter((p) => p.estado && p.stock > 0));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => { this.error.set(mensajeError(err)); this.cargando.set(false); },
    });
  }

  private nuevaLinea(productoId: number): FormGroup<LineaForm> {
    return this.fb.group({ productoId: this.fb.control<number | null>(productoId, Validators.required), cantidad: this.fb.control(1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]) });
  }
  elegirCliente(c: Cliente): void { this.form.controls.clienteId.setValue(c.id); this.buscarCliente.setValue(''); }
  cambiarCliente(): void { this.form.controls.clienteId.setValue(null); }
  agregarProducto(p: Producto): void {
    const existing = this.detalles.controls.find((line) => line.controls.productoId.value === p.id);
    if (existing) existing.controls.cantidad.setValue(Number(existing.controls.cantidad.value) + 1);
    else this.detalles.push(this.nuevaLinea(p.id));
    this.buscarProducto.setValue('');
  }
  agregarPrimero(event: Event): void { event.preventDefault(); const p = this.productosEncontrados()[0]; if (p) this.agregarProducto(p); }
  cantidadEnDetalle(id: number): number { return Number(this.valor().detalles?.find((d) => d.productoId === id)?.cantidad ?? 0); }
  quitarLinea(i: number): void { this.detalles.removeAt(i); }
  revisar(): void {
    if (this.form.invalid || this.hayExcesoDeStock()) { this.form.markAllAsTouched(); return; }
    this.error.set(null); this.confirmando.set(true);
  }
  confirmar(): void {
    const v = this.form.getRawValue();
    const dto: VentaRequest = { clienteId: Number(v.clienteId), detalles: v.detalles.map((d) => ({ productoId: Number(d.productoId), cantidad: Number(d.cantidad) })) };
    this.guardando.set(true);
    this.ventaService.registrar(dto).subscribe({
      next: (venta) => this.router.navigate(['/ventas', venta.id], { queryParams: this.imprimirAlRegistrar() ? { nueva: 1, imprimir: 1 } : { nueva: 1 } }),
      error: (err: HttpErrorResponse) => { this.guardando.set(false); this.confirmando.set(false); this.error.set(mensajeError(err)); },
    });
  }
}
