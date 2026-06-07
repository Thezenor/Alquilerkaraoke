import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("reserva: solicitar desde presupuesto y validar en admin", async ({ page }) => {
  const stamp = Date.now();
  const name = `Reserva E2E ${stamp}`;
  const email = `reserva_${stamp}@example.com`;

  // Presupuesto: calcular
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "5");
  await page.getByRole("button", { name: "Calcular presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "Presupuesto orientativo" })).toBeVisible();

  // Rellenar datos y enviar solicitud de reserva
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Enviar solicitud de reserva" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // Admin: ver y validar
  await login(page);
  await page.goto("/admin/reservas");
  await expect(page.getByText(name)).toBeVisible();
  await page.getByText(name).click();
  await page.selectOption("#status", "CONFIRMED");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Reserva actualizada")).toBeVisible();
});
