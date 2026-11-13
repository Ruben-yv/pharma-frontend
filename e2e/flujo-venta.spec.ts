import { APIRequestContext, expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

const API_URL = 'http://localhost:8081/api/v1';

async function actualizarProducto(
  request: APIRequestContext,
  token: string,
  producto: { id: number; nombre: string; precio: number; estado: boolean; categoriaId: number },
  stock: number,
  precio = producto.precio,
): Promise<{ modificadoPor: string | null }> {
  const response = await request.put(`${API_URL}/productos/${producto.id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      nombre: producto.nombre,
      precio,
      stock,
      estado: producto.estado,
      categoriaId: producto.categoriaId,
    },
  });
  expect(response.ok(), `No se pudo preparar/restaurar el stock del producto ${producto.id}`).toBeTruthy();
  return response.json();
}

test('el vendedor registra una venta y el catálogo refleja el stock descontado', async ({ page, request }) => {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'admin', password: 'Admin2026*' },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).token as string;

  const listado = await request.get(`${API_URL}/productos?pagina=0&tamanio=20&ordenarPor=nombre&direccion=asc`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(listado.ok()).toBeTruthy();
  const pagina = await listado.json();
  const producto = (pagina.contenido as Array<{
    id: number;
    nombre: string;
    precio: number;
    estado: boolean;
    categoriaId: number;
    stock: number;
  }>).find((item) => item.estado && item.stock > 0);
  expect(producto, 'Debe existir un producto activo con stock en la primera página').toBeTruthy();
  const stockOriginal = producto!.stock;
  const reportePrevio = await request.get(`${API_URL}/reportes/productos-mas-vendidos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(reportePrevio.ok()).toBeTruthy();
  const unidadesPrevias = ((await reportePrevio.json()) as Array<{
    productoId: number;
    cantidadVendida: number;
  }>).find((item) => item.productoId === producto!.id)?.cantidadVendida ?? 0;

  const sufijo = Date.now().toString().slice(-8);
  const clienteNuevo = {
    dni: sufijo,
    nombres: `E2E${sufijo}`,
    apellidos: 'Pruebas Pharma',
    email: `e2e.${sufijo}@example.test`,
    telefono: `9${sufijo}`,
    direccion: 'Cliente temporal de pruebas automatizadas',
    estado: true,
  };
  const altaCliente = await request.post(`${API_URL}/clientes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: clienteNuevo,
  });
  expect(altaCliente.status()).toBe(201);
  const cliente = await altaCliente.json() as { id: number; nombres: string };

  try {
    const precioNuevo = Number((producto!.precio + 0.01).toFixed(2));
    const productoModificado = await actualizarProducto(
      request, token, producto!, Math.max(stockOriginal, 6), precioNuevo,
    );
    expect(productoModificado.modificadoPor).toBe('admin');

    await iniciarSesion(page, 'vendedor', '/ventas/nueva');

    await page.getByTestId('buscar-cliente').fill(cliente.nombres);
    await page.getByTestId('opcion-cliente').first().click();

    await page.getByTestId('buscar-producto').fill(producto!.nombre);
    const opcionProducto = page.getByTestId('opcion-producto').first();
    const stockAntes = Number(await opcionProducto.getAttribute('data-stock'));
    expect(stockAntes).toBeGreaterThanOrEqual(2);
    await expect(opcionProducto).toContainText(precioNuevo.toFixed(2));
    await opcionProducto.click();
    await page.getByTestId('cantidad').last().fill('2');
    await expect(page.getByTestId('total-venta')).not.toHaveText(/S\/\s*0[,.]00/);

    let primerIntentoVencido = false;
    await page.route('**/api/v1/ventas', async (route) => {
      if (route.request().method() === 'POST' && !primerIntentoVencido) {
        primerIntentoVencido = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ status: 401, message: 'Token vencido' }),
        });
      } else {
        await route.continue();
      }
    });
    await page.getByRole('button', { name: 'Revisar venta' }).click();
    await expect(page.getByRole('dialog', { name: 'Confirmar venta' })).toBeVisible();
    const intentoVencido = page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/ventas') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    expect((await intentoVencido).status()).toBe(401);
    await expect(page).toHaveURL(/\/login\?.*expirada=1.*returnUrl=%2Fventas%2Fnueva/);

    await iniciarSesion(page, 'vendedor', '/ventas/nueva');
    await page.getByTestId('buscar-cliente').fill(cliente.nombres);
    await page.getByTestId('opcion-cliente').first().click();
    await page.getByTestId('buscar-producto').fill(producto!.nombre);
    const opcionTrasLogin = page.getByTestId('opcion-producto').first();
    await expect(opcionTrasLogin).toHaveAttribute('data-stock', String(stockAntes));
    await expect(opcionTrasLogin).toContainText(precioNuevo.toFixed(2));
    await opcionTrasLogin.click();
    await page.getByTestId('cantidad').last().fill('2');
    await expect(page.getByTestId('total-venta')).not.toHaveText(/S\/\s*0[,.]00/);
    await page.getByRole('button', { name: 'Revisar venta' }).click();
    await expect(page.getByRole('dialog', { name: 'Confirmar venta' })).toBeVisible();

    const respuestaRegistro = page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/ventas') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    const registro = await respuestaRegistro;
    expect(registro.status()).toBe(201);
    const venta = await registro.json();
    const requestId = registro.headers()['x-request-id'];
    await expect(page.getByText('Venta registrada correctamente.')).toBeVisible();

    const consultaAuditoria = await request.get(
      `${API_URL}/auditoria?accion=VENTA_REGISTRADA&pagina=0&tamanio=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(consultaAuditoria.ok()).toBeTruthy();
    const eventos = (await consultaAuditoria.json()).contenido as Array<{
      usuario: string;
      entidadId: number;
      requestId: string;
    }>;
    expect(eventos).toContainEqual(expect.objectContaining({
      usuario: 'vendedor',
      entidadId: venta.id,
      requestId,
    }));

    const consultaPrecio = await request.get(
      `${API_URL}/auditoria?accion=PRECIO_MODIFICADO&pagina=0&tamanio=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(consultaPrecio.ok()).toBeTruthy();
    const eventosPrecio = (await consultaPrecio.json()).contenido as Array<{
      usuario: string;
      entidadId: number;
      detalle: string;
    }>;
    expect(eventosPrecio).toContainEqual(expect.objectContaining({
      usuario: 'admin',
      entidadId: producto!.id,
      detalle: expect.stringContaining('->'),
    }));

    const reportePosterior = await request.get(`${API_URL}/reportes/productos-mas-vendidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(reportePosterior.ok()).toBeTruthy();
    const productoReportado = ((await reportePosterior.json()) as Array<{
      productoId: number;
      cantidadVendida: number;
    }>).find((item) => item.productoId === producto!.id);
    expect(productoReportado?.cantidadVendida).toBe(unidadesPrevias + 2);

    await page.goto('/productos?orden=nombre&dir=asc');
    const filaProducto = page
      .getByTestId('tabla-productos')
      .locator('tr', { hasText: producto!.nombre })
      .first();
    await expect(filaProducto).toContainText(String(stockAntes - 2));
  } finally {
    await actualizarProducto(request, token, producto!, stockOriginal, producto!.precio);
    await request.put(`${API_URL}/clientes/${cliente.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...clienteNuevo, estado: false },
    });
  }
});
