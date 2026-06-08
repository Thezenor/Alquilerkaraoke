import { test, expect } from "@playwright/test";

test("presupuesto: solicitar (se envía por email, sin mostrar precio)", async ({ page }) => {
  await page.goto("/es/presupuesto");
  await expect(page.getByRole("heading", { name: "Pide tu presupuesto" })).toBeVisible();

  await page.fill("#hours", "5");
  await page.fill("#name", "Test Presupuesto");
  await page.fill("#email", `presu_${Date.now()}@example.com`);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();

  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();
});

test("presupuesto: desde un pack, queda como referencia y guarda asistentes/horario", async ({ page }) => {
  const stamp = Date.now();
  const name = `Pack Ref ${stamp}`;

  // Entrar desde la ficha de un pack: el CTA lleva a /presupuesto?pack=slug.
  await page.goto("/es/packs");
  await page.getByRole("link", { name: "Ver detalles" }).first().click();
  await page.getByRole("main").getByRole("link", { name: "Pedir presupuesto" }).click();
  await expect(page).toHaveURL(/\/es\/presupuesto\?pack=/);
  await expect(page.getByText("Presupuesto para")).toBeVisible();

  // Rellenar los nuevos campos y enviar.
  await page.fill("#attendees", "80");
  await page.fill("#eventTime", "20:30");
  await page.fill("#name", name);
  await page.fill("#email", `packref_${stamp}@example.com`);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // En el admin, la reserva guarda asistentes y hora.
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  await page.waitForURL(/\/admin\/reservas\/[^/]+$/);
  await expect(page.getByText("Asistentes")).toBeVisible();
  await expect(page.getByRole("main")).toContainText("20:30");
  await expect(page.getByRole("main")).toContainText("80");
});
