import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("proforma: descarga un PDF válido de la reserva", async ({ page }) => {
  const stamp = Date.now();
  const name = `Proforma E2E ${stamp}`;
  const email = `proforma_${stamp}@example.com`;

  // Crear una reserva desde el presupuesto público.
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "4");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // Admin: abrir la reserva y obtener el enlace de la proforma.
  await login(page);
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  const href = await page.getByRole("link", { name: "Proforma (PDF)" }).getAttribute("href");
  expect(href).toBeTruthy();

  // Descargar usando las cookies del contexto autenticado.
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  const body = await res.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
});

test("proforma: sin sesión no entrega el PDF (redirige al login)", async ({ request }) => {
  const res = await request.get("/admin/reservas/cualquier-id/proforma", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toContain("/admin/login");
});
