import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("pagos: registrar un cobro marca la reserva como pagada", async ({ page }) => {
  const stamp = Date.now();
  const name = `Pago E2E ${stamp}`;
  const email = `pago_${stamp}@example.com`;

  // Crear una reserva desde el presupuesto público.
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "4");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // Admin: abrir la reserva. Empieza "Sin pagar".
  await login(page);
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  await expect(page.getByText("Sin pagar").first()).toBeVisible();

  // Leer el total mostrado y registrar un cobro por ese importe → "Pagado".
  await page.getByRole("button", { name: "Añadir pago" }).click();
  await expect(page.getByText("Pago registrado.")).toBeVisible();
  await expect(page.getByText("Pagado").first()).toBeVisible();
});
