# PharmaSoft

SPA en Angular 22 para administrar categorías mediante PharmaBackend.

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
- `src/app/features`: módulos de negocio; actualmente Inicio y Categorías.

El módulo de Categorías concentra sus rutas, modelo, servicio HTTP y páginas de listado y formulario. El servicio usa `http://localhost:8080/api/v1/categorias`, según la guía de la práctica.

## Compilar

```powershell
npm run build
```
