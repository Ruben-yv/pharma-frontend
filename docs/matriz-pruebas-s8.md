# Evidencias y hallazgos de la práctica S8

**Estudiante:** Rubén Yactayo Varillas  
**Actividad:** CRUD dependiente de Productos y Categorías
**Backend:** `sysventas`
**Rama de trabajo:** `feature/productos-varillas`

## Estado de ejecución

El frontend compila y el backend compila. La integración todavía no se ejecutó: durante la revisión no respondieron `localhost:8080` ni Oracle en `localhost:1522`. Por ello, los resultados HTTP de la tabla siguen como **Pendientes** y deben cambiarse únicamente después de ejecutar cada caso. Las capturas de navegador y Red quedan para adjuntar.

## Casos del paso 9

| N.º | Acción | Resultado que se debe comprobar | Estado | Evidencia pendiente |
|---:|---|---|---|---|
| 1 | Abrir Productos desde el sidebar | `GET /api/v1/productos?pagina=0&tamanio=10&ordenarPor=nombre&direccion=asc`; la tabla muestra la categoría. | Pendiente | `01-listado.png` |
| 2 | Hacer clic dos veces en Precio | Dos GET: `ordenarPor=precio&direccion=asc` y después `direccion=desc`. | Pendiente | `02-orden.png` |
| 3 | Elegir 5 por página y avanzar | GET con `tamanio=5&pagina=1`; paginador en página 2. | Pendiente | `03-paginacion.png` |
| 4 | Filtrar por una categoría | Solo productos de esa categoría entre los elementos de la página actual; sin nueva petición. | Pendiente | `04-filtro.png` |
| 5 | Abrir Nuevo producto | El selector ofrece categorías activas, sin la categoría inactiva. | Pendiente | `05-categorias-activas.png` |
| 6 | Registrar sin completar los campos | Se ven los errores de categoría, nombre y precio; no se envía POST. | Pendiente | `06-validacion.png` |
| 7 | Registrar un producto válido | POST 201; aparece en la lista con el nombre de categoría. | Pendiente | `07-alta.png` |
| 8 | Registrar otra vez el mismo nombre cambiando mayúsculas | POST 409; la SPA presenta el mensaje del backend. | Pendiente | `08-duplicado.png` |
| 9 | Editar un producto de categoría inactiva | Se conserva la categoría original y se muestra como inactiva; no se permite guardar hasta elegir una activa. | Pendiente | `09-edicion-inactiva.png` |
| 10 | Cambiar de categoría y guardar | PUT 200; la fila muestra la nueva categoría. | Pendiente | `10-cambio-categoria.png` |
| 11 | Dar de baja un producto | DELETE 204; la fila indica Inactivo y el botón queda deshabilitado. | Pendiente | `11-baja-logica.png` |
| 12 | Eliminar una categoría que tiene productos | DELETE 409 con el mensaje del backend; la categoría permanece. | Pendiente | `12-dependencia-categoria.png` |

## Hallazgos de implementación

- El selector de producto carga categorías desde `/api/categorias`, guarda `categoriaId` numérico y muestra las activas. En edición conserva la categoría asignada aunque esté inactiva, pero bloquea el guardado hasta seleccionar una activa.
- El backend verifica la categoría en altas y cambios, rechaza categorías inactivas con 409 y devuelve 404 para categorías inexistentes.
- El backend rechaza nombres repetidos sin distinguir mayúsculas, valida nombre (3–150), precio (mínimo 0.01), stock (entero no negativo) y categoría positiva.
- La baja de producto es lógica. Intentar dar de baja un producto inactivo nuevamente produce 409.
- La categoría no se puede eliminar mientras tenga productos asociados, incluso si estos están inactivos. Tampoco se puede desactivar mientras tenga productos activos.
- El filtro por categoría es local y se aplica únicamente al contenido de la página que llegó del backend. Si no aparece un producto, hay que cambiar de página o tamaño.

Estos hallazgos describen el comportamiento implementado en código y compilado. No son resultados HTTP observados; las respuestas reales se completan después de ejecutar los casos y adjuntar las capturas.
