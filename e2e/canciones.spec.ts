import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("canciones: la página de catálogo carga en la web", async ({ page }) => {
  await page.goto("/es/canciones");
  await expect(page.getByRole("heading", { name: "Catálogo de canciones" })).toBeVisible();
});

test("canciones: alta y baja de marca con calidad en el admin", async ({ page }) => {
  const brand = `Marca E2E ${Date.now()}`;
  await login(page);
  await page.goto("/admin/canciones");
  await expect(page.getByRole("heading", { name: "Canciones" })).toBeVisible();

  await page.locator('input[name="name"]').first().fill(brand);
  await page.locator('input[name="quality"]').first().fill("50");
  await page.getByRole("button", { name: "Añadir" }).click();
  const brandInput = page.locator(`input[value="${brand}"]`);
  await expect(brandInput).toBeVisible();

  // Eliminar para limpiar.
  page.on("dialog", (d) => d.accept());
  const row = page.locator("li", { has: page.locator(`input[value="${brand}"]`) });
  await row.getByRole("button", { name: "Eliminar marca" }).click();
  await expect(page.locator(`input[value="${brand}"]`)).toHaveCount(0);
});
