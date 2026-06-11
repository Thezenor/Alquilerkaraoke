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

  // Segundo producto: ejercita la vista de varias actividades en la ficha.
  await page.getByRole("button", { name: "+ Añadir producto" }).click();
  const line2 = page.getByTestId("quote-line").nth(1);
  await line2.locator("input").nth(0).fill("Opción Furor E2E");
  await line2.locator("input").nth(2).fill("1800.00");

  // Previsualizar (sin guardar) devuelve un PDF.
  const preview = await page.request.post("/admin/clientes/presupuesto/preview", {
    multipart: {
      customerName: name,
      customerEmail: email,
      customerPhone: "600555444",
      depositPercent: "50",
      lines: JSON.stringify([
        { name: "Opción Karaoke E2E", description: "Equipo", price: "750.00", hours: "4" },
        { name: "Opción Furor E2E", description: "Producción", price: "1800.00", hours: "4" },
      ]),
    },
  });
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-type"]).toContain("application/pdf");
  expect((await preview.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  await page.getByRole("button", { name: "Guardar y generar presupuesto" }).click();

  // Redirige a la ficha de la reserva creada y se muestra sin error (2 actividades).
  await page.waitForURL(/\/admin\/reservas\/.*created=quote/);
  const bookingUrl = page.url().split("?")[0];
  await expect(page.getByText("Presupuesto creado.")).toBeVisible();
  await expect(page.getByText("Opción Furor E2E")).toBeVisible();

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

  // Borrar el presupuesto/reserva desde su ficha (zona de peligro, confirm).
  await page.goto(bookingUrl);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar definitivamente" }).click();
  await page.waitForURL(/\/admin\/reservas(\?|$)/);
  const gone = await page.request.get(`${bookingUrl}/presupuesto`);
  expect(gone.status()).toBe(404);
});

test("presupuesto premium: sin sesión no entrega el PDF (redirige al login)", async ({ request }) => {
  const res = await request.get("/admin/reservas/cualquier-id/presupuesto", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toContain("/admin/login");
});
