export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
}

export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '⌂' },
  { etiqueta: 'Categorías', ruta: '/categorias', icono: '📁' },
  { etiqueta: 'Productos', ruta: '/productos', icono: '💊' },
  { etiqueta: 'Clientes', ruta: '/clientes', icono: '👥' },
  { etiqueta: 'Ventas', ruta: '/ventas', icono: '🧾' },
  { etiqueta: 'Reporte por categoría', ruta: '/reportes/ventas-por-categoria', icono: '📊' },
];
