# Matriz de pruebas de dependencias entre Categorías y Productos

**Actividad Autónoma - Sesión 8**  
**Estudiante:** Rubén Yactayo Varillas  
**Base URL:** `http://localhost:8080/api/v1`  
**Estado inicial requerido:** al menos tres categorías activas, una inactiva y ocho productos distribuidos entre ellas, incluido uno dado de baja.

La ejecución integrada queda pendiente porque `localhost:8080` y Oracle (`localhost:1522`) no respondieron al revisar. Lo siguiente es una predicción basada en el código fuente disponible, no resultado HTTP observado. El backend `sysventas` expone `/api/productos` y `/api/categorias`, mientras la guía define `baseUrl=/api/v1`; se debe alinear la URL antes de ejecutar. Adjunta captura real y sustituye los estados “No ejecutado” por Pasa/Falla solo después de comprobar cada caso.

Para C-03 y B-04 se define una regla esperada que debe justificarse en el informe: una categoría no se desactiva si tiene productos activos, y no se elimina mientras conserve productos asociados, aunque estén dados de baja.

| ID | Operación | Precondición | Datos | Resultado esperado | Resultado obtenido (SPA y HTTP) | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| A-01 | Crear producto válido | Existe una categoría activa; nombre disponible. | `Producto A-01`, precio `5.50`, stock `10`, estado activo, ID de categoría activa. | HTTP 201; aparece en el listado con su categoría. | Previsto por código: 201 en /api/productos si categoría activa/existente; endpoint no ejecutado. Estado: No ejecutado. | `A-01_spa.png` |
| A-02 | Crear producto sin categoría | Abrir Nuevo producto; dejar el selector sin elegir. | Omitir `categoriaId`; probar también el mismo cuerpo desde Postman. | SPA no envía POST; API responde 400 por campo requerido. | Previsto: la SPA bloquea; en /api/productos sin categoriaId, @NotNull produce 400. Sin ejecutar. Estado: No ejecutado. | `A-02_spa.png`, `A-02_postman.png` |
| A-03 | Crear producto con categoría inexistente | Se conoce un ID que no existe. | Producto válido con `categoriaId: 999`. | API responde 404 con mensaje de categoría no encontrada. | Previsto: 404 por RecursosNoEncontradosException en ProductoServiceImpl.create(). Sin ejecutar. Estado: No ejecutado. | `A-03_postman.png` |
| A-04 | Crear producto en categoría inactiva | Se conoce el ID de una categoría con `estado: false`. | Producto válido con el ID de esa categoría. | SPA no ofrece esa categoría; API debe rechazar con 409. | Riesgo confirmado en revisión: create() no consulta categoria.estado; podría aceptar (201). No ejecutar. Estado: No ejecutado. | `A-04_spa.png`, `A-04_postman.png` |
| A-05 | Repetir nombre con otra capitalización | Ya existe un producto con ese nombre. | Enviar el mismo nombre con mayúsculas/minúsculas distintas. | API responde 409 por nombre duplicado; la SPA muestra el mensaje del servidor. | Previsto: 409 por existsByNombreIgnoreCase en alta. Sin ejecutar. Estado: No ejecutado. | `A-05_spa.png`, `A-05_postman.png` |
| A-06 | Crear con precio y stock inválidos | Abrir el formulario de producto. | Precio `0`, stock `-1`; repetir directamente por API. | SPA bloquea el envío; API responde 400 e informa ambos campos en `validationErrors`. | Riesgo confirmado: DTO carece de @Positive/@Min para precio y stock; valores pueden aceptarse (201). Sin ejecutar. Estado: No ejecutado. | `A-06_spa.png`, `A-06_postman.png` |
| C-01 | Cambiar a otra categoría activa | Existe un producto activo y dos categorías activas. | PUT válido con `categoriaId` de la segunda categoría. | HTTP 200; el listado muestra la nueva categoría. | Previsto: 200 para categoría existente. Sin ejecutar. Estado: No ejecutado. | `C-01_spa.png` |
| C-02 | Cambiar a una categoría inactiva | Existe un producto y una categoría inactiva. | PUT del producto con el ID de la categoría inactiva; probar también por API. | SPA impide guardar; API debe rechazar con 409. | Riesgo confirmado: update() no comprueba estado de la categoría; podría aceptar (200). Sin ejecutar. Estado: No ejecutado. | `C-02_spa.png`, `C-02_postman.png` |
| C-03 | Desactivar categoría con productos activos | Una categoría activa tiene uno o más productos activos. | Editar la categoría y cambiar `estado` a `false`. | Regla propuesta: API responde 409 y exige reasignar o dar de baja los productos antes. | Riesgo confirmado: CategoriaServiceImpl.update() no consulta productos; podría desactivar (200). Sin ejecutar. Estado: No ejecutado. | `C-03_spa.png`, `C-03_postman.png` |
| C-04 | Registrar tras desactivar la categoría en otra pestaña | Pestaña 1 tiene abierto Nuevo producto con categoría X; pestaña 2 permite desactivar X. | Desactivar X en pestaña 2; volver a pestaña 1 e intentar registrar. | El producto no queda asociado a una categoría inactiva; API rechaza la operación. | La lista del formulario no se refresca; create() tampoco revisa estado; podría aceptar (201). Sin ejecutar. Estado: No ejecutado. | `C-04_pestanas.png`, `C-04_red.png` |
| B-01 | Dar de baja producto activo | Existe un producto activo. | DELETE del ID del producto desde la SPA. | HTTP 204; después del refresco figura Inactivo y el botón queda deshabilitado. | DELETE backend elimina físicamente y responde 204; la fila no queda Inactiva. Sin ejecutar. Estado: No ejecutado. | `B-01_spa.png`, `B-01_postman.png` |
| B-02 | Dar de baja el mismo producto otra vez | B-01 ya dejó el producto inactivo. | Repetir DELETE del mismo ID desde Postman. | API responde 409 indicando que ya está inactivo. | Después de DELETE físico, repetir apunta a ID inexistente y debería dar 404, no 409. Sin ejecutar. Estado: No ejecutado. | `B-02_postman.png` |
| B-03 | Eliminar categoría sin productos | Categoría activa sin productos asociados. | DELETE del ID de la categoría. | HTTP 204; desaparece del listado y del selector de Productos. | Previsto: 204 si categoría no tiene referencias. Sin ejecutar. Estado: No ejecutado. | `B-03_spa.png`, `B-03_postman.png` |
| B-04 | Eliminar categoría cuyos productos están dados de baja | Una categoría conserva productos asociados, todos con estado inactivo. | DELETE de la categoría. | Regla propuesta: API responde 409 porque los productos históricos aún la referencian. | No hay regla explícita en servicio; la FK puede impedir borrado con error no controlado. HTTP exacto no verificable. Estado: No ejecutado. | `B-04_spa.png`, `B-04_postman.png` |
| A-07 | Crear producto en límites válidos | Existe categoría activa; nombre disponible. | Precio `0.01`, stock `0`, nombre de 3 caracteres. | HTTP 201; se aceptan los mínimos permitidos. | Previsto: nombre de 3 caracteres válido; DTO no limita precio/stock inferior; 201. Sin ejecutar. Estado: No ejecutado. | `A-07_spa.png`, `A-07_postman.png` |
| A-08 | Crear producto con nombre demasiado corto | Abrir formulario de producto. | Nombre de 2 caracteres; probar también POST directo. | SPA no envía POST; API responde 400 por longitud mínima. | Previsto: 400 por @Size(min=3). Sin ejecutar. Estado: No ejecutado. | `A-08_spa.png`, `A-08_postman.png` |
| C-05 | Actualizar con categoría inexistente | Existe un producto que se puede editar. | PUT válido con `categoriaId: 999`. | API responde 404 y el producto conserva su categoría anterior. | Previsto: 404 al no encontrar categoriaId. Sin ejecutar. Estado: No ejecutado. | `C-05_postman.png` |
| B-05 | Eliminar categoría con productos activos | Categoría activa con al menos un producto activo. | DELETE del ID de la categoría. | API responde 409 y conserva la categoría relacionada. | No hay regla explícita en servicio; la FK puede impedir borrado con error no controlado. HTTP exacto no verificable. Estado: No ejecutado. | `B-05_spa.png`, `B-05_postman.png` |

## Resumen de ejecución

| Grupo | Casos | Ejecutados | Pasa | Falla |
|---|---:|---:|---:|---:|
| Altas | 8 | 0 | 0 | 0 |
| Cambios | 5 | 0 | 0 | 0 |
| Bajas | 5 | 0 | 0 | 0 |
| **Total** | **18** | **0** | **0** | **0** |

> Los contadores reflejan la ejecución real (actualmente 0/18). Las predicciones estáticas anteriores no cuentan como prueba. La URL /api/v1 establecida por la guía no coincide con los mappings de sysventas (/api), y ambos servicios locales están apagados.
