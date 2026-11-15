import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

const API_URL = 'http://localhost:8081/api/v1';

test('E2E-08: la API rechaza una venta con cantidad mayor al stock y no la guarda', async ({ request }) => {
  const adminLogin = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'admin', password: 'Admin2026*' },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminToken = (await adminLogin.json()).token as string;
  const vendedorLogin = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'vendedor', password: 'Vendedor2026*' },
  });
  expect(vendedorLogin.ok()).toBeTruthy();
  const vendedorToken = (await vendedorLogin.json()).token as string;

  const clientesResponse = await request.get(`${API_URL}/clientes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(clientesResponse.ok()).toBeTruthy();
  const clientes = await clientesResponse.json() as Array<{ id: number; estado: boolean }>;
  const cliente = clientes.find((item) => item.estado);
  expect(cliente).toBeTruthy();

  const productosResponse = await request.get(`${API_URL}/productos?pagina=0&tamanio=20`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(productosResponse.ok()).toBeTruthy();
  const pagina = await productosResponse.json();
  const producto = (pagina.contenido as Array<{
    id: number; nombre: string; precio: number; stock: number; estado: boolean; categoriaId: number;
  }>).find((item) => item.estado && item.stock > 1);
  expect(producto).toBeTruthy();
  const stockOriginal = producto!.stock;
  const actualizarStock = async (stock: number) => request.put(`${API_URL}/productos/${producto!.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      nombre: producto!.nombre, precio: producto!.precio, stock,
      estado: producto!.estado, categoriaId: producto!.categoriaId,
    },
  });

  try {
    expect((await actualizarStock(1)).ok()).toBeTruthy();
    const ventasAntes = await request.get(`${API_URL}/ventas/buscar?pagina=0&tamanio=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(ventasAntes.ok()).toBeTruthy();
    const totalAntes = (await ventasAntes.json()).totalElementos as number;

    const intento = await request.post(`${API_URL}/ventas`, {
      headers: { Authorization: `Bearer ${vendedorToken}` },
      data: { clienteId: cliente!.id, detalles: [{ productoId: producto!.id, cantidad: 2 }] },
    });
    expect(intento.status()).toBe(409);
    expect((await intento.json()).message).toContain('Stock insuficiente');

    const ventasDespues = await request.get(`${API_URL}/ventas/buscar?pagina=0&tamanio=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(ventasDespues.ok()).toBeTruthy();
    expect((await ventasDespues.json()).totalElementos).toBe(totalAntes);
  } finally {
    expect((await actualizarStock(stockOriginal)).ok()).toBeTruthy();
  }
});

test('E2E-09: no abre confirmación de venta sin cliente y productos', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await expect(page.getByText('Busque y seleccione el cliente.')).toBeVisible();
  await expect(page.getByText('Agregue al menos un producto', { exact: false })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Confirmar venta' })).toHaveCount(0);
});

test('E2E-15: la API aplica permisos y devuelve 400/404 en solicitudes inválidas', async ({ request }) => {
  const adminLogin = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'admin', password: 'Admin2026*' },
  });
  expect(adminLogin.ok()).toBeTruthy();
  const adminToken = (await adminLogin.json()).token as string;
  const vendedorLogin = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'vendedor', password: 'Vendedor2026*' },
  });
  expect(vendedorLogin.ok()).toBeTruthy();
  const vendedorToken = (await vendedorLogin.json()).token as string;

  const sinPermiso = await request.get(`${API_URL}/auditoria?pagina=0&tamanio=10`, {
    headers: { Authorization: `Bearer ${vendedorToken}` },
  });
  expect(sinPermiso.status()).toBe(403);

  const noEncontrado = await request.get(`${API_URL}/productos/999999999`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(noEncontrado.status()).toBe(404);

  const solicitudInvalida = await request.post(`${API_URL}/ventas`, {
    headers: { Authorization: `Bearer ${vendedorToken}` },
    data: { clienteId: 1, detalles: [] },
  });
  expect(solicitudInvalida.status()).toBe(400);
});

test('E2E-12: admin encuentra un cliente nuevo en la auditoría con filtros en URL', async ({ page, request }) => {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { username: 'admin', password: 'Admin2026*' },
  });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).token as string;
  const sufijo = Date.now().toString().slice(-8);
  const nuevoCliente = {
    dni: sufijo, nombres: `Auditoria${sufijo}`, apellidos: 'E2E S14',
    email: `auditoria.${sufijo}@example.test`, telefono: `9${sufijo}`,
    direccion: 'Cliente temporal de pruebas', estado: true,
  };
  const alta = await request.post(`${API_URL}/clientes`, {
    headers: { Authorization: `Bearer ${token}` }, data: nuevoCliente,
  });
  expect(alta.status()).toBe(201);
  const cliente = await alta.json() as { id: number };

  try {
    await iniciarSesion(page, 'admin', '/auditoria');
    await expect(page.getByTestId('tabla-auditoria')).toBeVisible();
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Acción').fill('CLIENTE_REGISTRADO');
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auditoria') && response.url().includes('accion=CLIENTE_REGISTRADO'));
    await page.getByRole('button', { name: 'Buscar' }).click();
    expect((await responsePromise).status()).toBe(200);
    await expect(page).toHaveURL(/usuario=admin/);
    await expect(page).toHaveURL(/accion=CLIENTE_REGISTRADO/);
    await expect(page).toHaveURL(/pagina=0/);
    await expect(page.getByTestId('tabla-auditoria')).toContainText('Cliente registrado');
  } finally {
    await request.put(`${API_URL}/clientes/${cliente.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...nuevoCliente, estado: false },
    });
  }
});

test('E2E-13: vendedor no ve Auditoría y la ruta directa muestra acceso denegado', async ({ page }) => {
  await iniciarSesion(page, 'vendedor');
  await expect(page.getByRole('link', { name: 'Auditoría' })).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page).toHaveURL(/\/acceso-denegado/);
  await expect(page.getByRole('heading', { name: /403.*Acceso denegado/ })).toBeVisible();
});

test('E2E-14: un token alterado en sessionStorage termina en login con aviso de expiración', async ({ page }) => {
  await iniciarSesion(page, 'admin');
  await page.evaluate(() => {
    const clave = 'pharmasoft.sesion';
    const sesion = JSON.parse(sessionStorage.getItem(clave) ?? '{}') as { token?: string };
    sesion.token = `${sesion.token ?? 'token'}.alterado`;
    sessionStorage.setItem(clave, JSON.stringify(sesion));
  });
  await page.reload();
  await page.goto('/productos');
  await expect(page).toHaveURL(/\/login\?.*expirada=1/);
  await expect(page.getByRole('status')).toContainText('Su sesión expiró');
});
