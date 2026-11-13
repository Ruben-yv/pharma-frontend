import { expect, Page } from '@playwright/test';

export const USUARIOS = {
  admin: { usuario: 'admin', clave: 'Admin2026*' },
  vendedor: { usuario: 'vendedor', clave: 'Vendedor2026*' },
  almacen: { usuario: 'almacen', clave: 'Almacen2026*' },
} as const;

export async function iniciarSesion(
  page: Page,
  quien: keyof typeof USUARIOS,
  ruta = '/inicio',
): Promise<void> {
  const { usuario, clave } = USUARIOS[quien];
  await page.goto(ruta);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}
