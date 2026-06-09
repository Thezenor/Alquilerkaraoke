import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("presupuesto admin: crear desde clientes, alta de usuario y PDF premium", async ({ page }) => {
  const stamp = Date.now();
  const name = `Presupuesto E2E ${stamp}`;
  const email = `presupuesto_${stamp}@example.com`;

  await login(page);
  await page.goto("/admin/clientes/presupuesto");

  // Datos del cliente (email + teléfono → alta de usuario).
  await page.fill('input[name="customerName"]', name);
  await page.fill('input[name="customerEmail"]', email);
  await page.fill('input[name="customerPhone"]', "600555444");

  // Producto 1: nombre, "qué incluye" y precio editables (sin depender de packs sembrados).
  // Inputs del producto en orden: [nombre], [horas], [precio]; más una textarea.
  const line = page.getByTestId("quote-line").first();
  await line.locator("input").nth(0).fill("Opción Karaoke E2E");
  await line.locator("input").nth(2).fill("750.00");
  await line.locator("textarea").fill("Equipo 2.400 W\n2 micrófonos\nMontaje incluido");

  await page.getByRole("button", { name: "Guardar y generar presupuesto" }).click();

  // Redirige a la ficha de la reserva creada.
  await page.waitForURL(/\/admin\/reservas\/.*created=quote/);
  await expect(page.getByText("Presupuesto creado.")).toBeVisible();

  // El PDF premium se descarga con la sesión autenticada.
  const href = await page.getByRole("link", { name: "Presupuesto (PDF premium)" }).getAttribute("href");
  expect(href).toBeTruthy();
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  const body = await res.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // El cliente quedó dado de alta y aparece en clientes.
  await page.goto(`/admin/clientes?q=${encodeURIComponent(email)}`);
  await expect(page.getByText(email)).toBeVisible();
});

test("presupuesto premium: sin sesión no entrega el PDF (redirige al login)", async ({ request }) => {
  const res = await request.get("/admin/reservas/cualquier-id/presupuesto", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toContain("/admin/login");
});
