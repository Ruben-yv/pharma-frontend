import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

test.describe('Autenticación', () => {
  test('una ruta protegida sin sesión lleva al login con returnUrl', async ({ page }) => {
    await page.goto('/ventas');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fventas/);
  });

  test('credenciales incorrectas muestran el mensaje del backend', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Usuario o contraseña incorrectos/);
  });

  test('al iniciar sesión vuelve a la ruta solicitada', async ({ page }) => {
    await iniciarSesion(page, 'vendedor', '/ventas');
    await expect(page).toHaveURL(/\/ventas$/);

    let yaVencio = false;
    await page.route('**/api/v1/ventas/buscar**', async (route) => {
      if (yaVencio) {
        await route.continue();
        return;
      }
      yaVencio = true;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 401, message: 'Token vencido' }),
      });
    });
    await page.goto('/ventas');
    await expect(page).toHaveURL(/\/login\?.*expirada=1.*returnUrl=%2Fventas/);

    await page.getByLabel('Usuario').fill('vendedor');
    await page.getByLabel('Contraseña', { exact: true }).fill('Vendedor2026*');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/ventas$/);
  });
});
