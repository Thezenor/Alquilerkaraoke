import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@alquilerkaraoke.com";
const ADMIN_PASSWORD = "Admin_dev_2026!";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("rgpd: baja de marketing pública confirma sin revelar si el email existe", async ({ page }) => {
  await page.goto("/es/baja-marketing");
  await expect(page.getByRole("heading", { name: "Baja de marketing" })).toBeVisible();
  await page.fill("#email", `nobody_${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Darme de baja" }).click();
  await expect(page.getByText(/dejará de recibir comunicaciones/i)).toBeVisible();
});

test("rgpd: anonimizar una solicitud desde el admin", async ({ page }) => {
  const stamp = Date.now();
  const name = `RGPD ${stamp}`;
  const email = `rgpd_${stamp}@example.com`;

  // Crear un lead público.
  await page.goto("/es/contacto");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#message", "Solicitud para prueba RGPD.");
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("Hemos recibido tu solicitud")).toBeVisible();

  // Admin: abrir el detalle y anonimizar (aceptando el confirm).
  await adminLogin(page);
  await page.goto("/admin/solicitudes");
  await page.getByText(name).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Anonimizar datos personales" }).click();

  // Tras anonimizar, el nombre original desaparece y queda "Anonimizado".
  await expect(page.getByRole("heading", { name: "Anonimizado" })).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);
});
