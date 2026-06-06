import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@alquilerkaraoke.com";
const ADMIN_PASSWORD = "Admin_dev_2026!";

test("contacto: enviar formulario público y gestionarlo en el admin", async ({ page }) => {
  const stamp = Date.now();
  const name = `E2E Lead ${stamp}`;
  const email = `e2e_${stamp}@example.com`;

  // 1) Enviar formulario público
  await page.goto("/es/contacto");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#phone", "600111222");
  await page.fill("#message", "Solicitud de prueba E2E.");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("Hemos recibido tu solicitud")).toBeVisible();

  // 2) Login admin
  await page.goto("/admin/login");
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");

  // 3) Aparece en la lista de solicitudes
  await page.goto("/admin/solicitudes");
  await expect(page.getByText(name)).toBeVisible();

  // 4) Abrir detalle y responder
  await page.getByText(name).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await page.selectOption("#status", "ANSWERED");
  await page.fill("#response", "Respondido en la prueba E2E.");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Solicitud actualizada")).toBeVisible();
});
