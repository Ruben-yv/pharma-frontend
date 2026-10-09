# PharmaSoft

SPA en Angular 22 para administrar categorías, productos y clientes mediante PharmaBackend.

## Requisitos

- Node.js 22.22.3 o 24.15 LTS.
- Angular CLI 22.
- Oracle y PharmaBackend ejecutándose en `http://localhost:8080`.

## Ejecutar el frontend

```powershell
npm install
npm start
```

Abre `http://localhost:4200`. La URL base de la API está en `src/environments/environment.ts` y `environment.development.ts`.

## Estructura

- `src/app/core`: configuración del menú, modelo de errores y utilidades HTTP compartidas.
- `src/app/shared`: páginas reutilizables, incluida la ruta 404.
- `src/app/layout`: layout principal, encabezado y sidebar.
- `src/app/features`: módulos de negocio de Inicio, Categorías, Productos y Clientes.

Los módulos concentran sus rutas, modelos, servicios HTTP y páginas de listado y formulario. Productos usa `GET http://localhost:8080/api/v1/productos` con `pagina`, `tamanio`, `ordenarPor` y `direccion`; ofrece paginación y orden del servidor, filtro local por categoría en la página cargada, categorías activas en el formulario y baja lógica. Las operaciones de detalle, alta, cambio y baja usan la misma ruta versionada.

El backend `sysventas` conserva las rutas `/api/productos` y `/api/categorias` para clientes existentes, y expone además `/api/v1/productos` y `/api/v1/categorias` para la SPA.

## Compilar

```powershell
npm run build
```
