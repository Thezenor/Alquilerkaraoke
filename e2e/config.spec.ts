import { test, expect } from "@playwright/test";

const EMAIL = "admin@alquilerkaraoke.com";
const PASSWORD = "Admin_dev_2026!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("guardar configuración de empresa y reflejarse en la web pública", async ({ page }) => {
  await login(page);

  // Ir a Configuración
  await page.goto("/admin/configuracion");
  await expect(page.getByRole("heading", { name: "Configuración de empresa" })).toBeVisible();

  // Cambiar teléfono a un valor de prueba y guardar
  await page.locator("#phone").fill("600111222");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();

  // La web pública debe reflejar el nuevo teléfono (revalidación por tag)
  await page.goto("/es");
  await expect(page.locator('a[href="https://wa.me/34600111222"]').first()).toBeVisible();

  // Restaurar el teléfono original para dejar la BD limpia
  await page.goto("/admin/configuracion");
  await page.locator("#phone").fill("607724965");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();
});

test("la configuración exige sesión", async ({ page }) => {
  await page.goto("/admin/configuracion");
  await expect(page).toHaveURL(/\/admin\/login/);
});
