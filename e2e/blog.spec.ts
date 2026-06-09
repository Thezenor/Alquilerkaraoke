import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("blog: crear y publicar una entrada y verla en la web", async ({ page }) => {
  const stamp = Date.now();
  const title = `Entrada E2E ${stamp}`;
  const slug = `entrada-e2e-${stamp}`;

  await login(page);
  await page.goto("/admin/blog/nuevo");
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="slug"]', slug);
  // Asistente IA: sin clave configurada informa correctamente.
  await page.getByRole("button", { name: /Generar borrador/ }).click();
  await expect(page.getByText(/IA no configurada/)).toBeVisible();
  await page.fill('textarea[name="content"]', "# Hola\n\nEsto es **contenido** de prueba.\n\n- punto uno\n- punto dos");
  await page.selectOption('select[name="status"]', "PUBLISHED");
  await page.getByRole("button", { name: "Guardar entrada" }).click();
  await page.waitForURL("**/admin/blog");
  await expect(page.getByText(title)).toBeVisible();

  // Listado público.
  await page.goto("/es/blog");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Detalle: render Markdown (encabezado + negrita).
  await page.goto(`/es/blog/${slug}`);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hola" })).toBeVisible();
  await expect(page.locator("strong", { hasText: "contenido" })).toBeVisible();

  // Limpieza.
  await page.goto("/admin/blog");
  await page.getByText(title).click();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.waitForURL("**/admin/blog");
  await expect(page.getByText(title)).toHaveCount(0);
});
