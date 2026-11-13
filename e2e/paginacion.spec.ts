import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

test('productos se paginan en el servidor y la página queda en la URL', async ({ page }) => {
  await iniciarSesion(page, 'admin', '/productos');
  const filas = page.getByTestId('tabla-productos').locator('tbody tr');

  await expect(filas).toHaveCount(20);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de \d+/);

  const respuesta = page.waitForResponse(
    (response) => response.url().includes('/api/v1/productos') && response.url().includes('pagina=1'),
  );
  await page.getByRole('button', { name: 'Siguiente' }).click();
  expect((await respuesta).status()).toBe(200);
  await expect(page).toHaveURL(/pagina=1/);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 2 de/);

  await page.reload();
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 2 de/);

  await page.goto('/ventas?pagina=5&tamanio=10');
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 6 de/);
  await page.getByLabel('Desde').fill('2026-11-01');
  await page.getByLabel('Hasta').fill('2026-11-12');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de/);
});
