import { test, expect, type Page } from "@playwright/test";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function makeBooking(page: Page, name: string, email: string) {
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "5");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();
}

test("descuento profesional: solo aplica si el cliente está marcado como profesional", async ({ page }) => {
  const stamp = Date.now();
  const email = `pro_${stamp}@example.com`;

  // 1) Primera reserva (cliente nuevo, sin descuento) → crea el cliente
  await makeBooking(page, `Normal ${stamp}`, email);

  // 2) Admin: marcar al cliente como profesional con 20%
  await adminLogin(page);
  await page.goto("/admin/clientes");
  await page.getByText(email).click();
  await expect(page).toHaveURL(/\/admin\/clientes\//);
  await page.check('input[name="isProfessional"]');
  await page.fill("#discountPercent", "20");
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await page.waitForURL("**/admin/clientes");

  // 3) Nueva reserva con el mismo email (ahora profesional) → debe llevar descuento
  await makeBooking(page, `Pro ${stamp}`, email);

  // 4) Verificar en admin que la reserva del cliente Pro tiene descuento aplicado
  await page.goto("/admin/reservas");
  await page.getByText(`Pro ${stamp}`).first().click();
  await expect(page.getByText("Descuento profesional")).toBeVisible();
});
