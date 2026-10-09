import { Routes } from '@angular/router';
import { ProductoForm } from './pages/producto-form/producto-form';
import { ProductoList } from './pages/producto-list/producto-list';

export const PRODUCTOS_ROUTES: Routes = [
  { path: '', component: ProductoList, title: 'Productos' },
  { path: 'nuevo', component: ProductoForm, title: 'Nuevo producto' },
  { path: ':id/editar', component: ProductoForm, title: 'Editar producto' },
];
