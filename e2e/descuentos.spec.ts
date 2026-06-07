import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("descuentos: crear código y aplicarlo en un presupuesto", async ({ page }) => {
  const code = `E2E${Date.now()}`.toUpperCase();
  const name = `Desc E2E ${Date.now()}`;
  const email = `desc_${Date.now()}@example.com`;

  // Crear un código del 50% en el admin.
  await login(page);
  await page.goto("/admin/descuentos/nuevo");
  await page.fill('input[name="code"]', code);
  await page.selectOption('select[name="valueType"]', "PERCENT");
  await page.fill('input[name="value"]', "50");
  await page.getByRole("button", { name: "Guardar código" }).click();
  await page.waitForURL("**/admin/descuentos");
  await expect(page.getByText(code)).toBeVisible();

  // Solicitar presupuesto con el código.
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "4");
  await page.fill("#code", code);
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // En el admin, la reserva muestra el descuento con el código.
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  await expect(page.getByText(`Descuento (código ${code})`)).toBeVisible();

  // El código figura como usado (1 uso).
  await page.goto("/admin/descuentos");
  await page.getByText(code).click();
  await expect(page.getByText(/Usado 1 vez/)).toBeVisible();
});
