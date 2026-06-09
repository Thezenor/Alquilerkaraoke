import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function deleteEventIfExists(page: Page, name: RegExp) {
  await page.goto("/admin/eventos");
  const link = page.getByRole("link", { name });
  if (await link.count()) {
    await link.first().click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.waitForURL("**/admin/eventos");
  }
}

test("eventos: hub y página de tipo de evento con contenido y FAQ", async ({ page }) => {
  await page.goto("/es/eventos");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Bodas/ }).first().click();
  await expect(page).toHaveURL(/\/es\/eventos\/bodas/);
  await expect(page.getByRole("heading", { level: 1, name: "Bodas", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preguntas frecuentes" })).toBeVisible();
});

test("eventos admin: crear, publicar y borrar (con botón IA)", async ({ page }) => {
  await login(page);
  await deleteEventIfExists(page, /Evento Test E2E/);

  await page.goto("/admin/eventos/nuevo");
  await page.fill('input[name="name"]', "Evento Test E2E");
  await page.fill('input[name="shortDescription"]', "Evento de prueba E2E.");
  await page.fill('textarea[name="features"]', "Montaje completo\nCon o sin técnico");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL("**/admin/eventos");
  await expect(page.getByText("Evento Test E2E").first()).toBeVisible();

  // Visible en la web.
  await page.goto("/es/eventos/evento-test-e2e");
  await expect(page.getByRole("heading", { level: 1, name: "Evento Test E2E", exact: true })).toBeVisible();
  await expect(page.getByText("Montaje completo")).toBeVisible();

  // Botón IA presente; sin clave informa de que no está configurada.
  await page.goto("/admin/eventos");
  await page.getByRole("link", { name: /Evento Test E2E/ }).first().click();
  await page.getByRole("button", { name: /Generar con IA/ }).click();
  await expect(page.getByText(/IA no configurada/)).toBeVisible();

  // Limpieza.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.waitForURL("**/admin/eventos");
});
