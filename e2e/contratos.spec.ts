import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("contrato: generar, firmar online y descargar el PDF", async ({ page }) => {
  const stamp = Date.now();
  const name = `Contrato E2E ${stamp}`;
  const email = `contrato_${stamp}@example.com`;

  // Crear reserva.
  await page.goto("/es/presupuesto");
  await page.fill("#hours", "4");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // Admin: abrir reserva y generar contrato.
  await login(page);
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  await page.getByRole("button", { name: "Generar contrato" }).click();

  const pdfHref = await page.getByRole("link", { name: "PDF del contrato" }).getAttribute("href");
  expect(pdfHref).toMatch(/^\/contrato\/.+\/pdf$/);
  const token = pdfHref!.split("/")[2];

  // PDF disponible (con el token) y válido.
  const pdfRes = await page.request.get(pdfHref!);
  expect(pdfRes.status()).toBe(200);
  expect(pdfRes.headers()["content-type"]).toContain("application/pdf");

  // Página pública de firma → firmar.
  await page.goto(`/contrato/${token}`);
  await expect(page.getByRole("heading", { name: "Contrato de servicio" })).toBeVisible();
  await page.fill('input[name="name"]', name);
  await page.check('input[name="accept"]');
  await page.getByRole("button", { name: "Firmar contrato" }).click();
  await expect(page.getByText("Contrato firmado correctamente.")).toBeVisible();

  // Al recargar, ya consta firmado.
  await page.goto(`/contrato/${token}`);
  await expect(page.getByText("Este contrato ya está firmado.")).toBeVisible();
});

test("contrato: token inexistente devuelve 404", async ({ request }) => {
  const res = await request.get("/contrato/token-que-no-existe", { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});
