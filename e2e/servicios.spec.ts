import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("servicios: crear en admin, aparece en el menú y su página SEO lista packs", async ({ page }) => {
  const stamp = Date.now();
  const name = `Servicio E2E ${stamp}`;
  const slug = `servicio-e2e-${stamp}`;

  // Crear servicio asociado a la categoría "Karaoke" (tiene packs en el seed).
  await login(page);
  await page.goto("/admin/servicios/nuevo");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="slug"]', slug);
  await page.fill('input[name="category"]', "Karaoke");
  await page.fill('input[name="shortDescription"]', "Descripción corta E2E.");
  await page.fill('textarea[name="description"]', "# Título\n\nContenido **SEO** de prueba.");
  await page.getByRole("button", { name: "Guardar servicio" }).click();
  await page.waitForURL("**/admin/servicios");
  await expect(page.getByText(name)).toBeVisible();

  // Página pública del servicio: muestra contenido y lista packs de Karaoke.
  await page.goto(`/es/servicios/${slug}`);
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Título" })).toBeVisible();
  await expect(page.getByText("Opciones disponibles")).toBeVisible();

  // Aparece en el desplegable "Servicios" del menú (al menos un enlace al slug).
  await page.goto("/es");
  await expect(page.locator(`a[href="/es/servicios/${slug}"]`).first()).toBeAttached();

  // Limpieza.
  await page.goto("/admin/servicios");
  await page.getByText(name).click();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.waitForURL("**/admin/servicios");
  await expect(page.getByText(name)).toHaveCount(0);
});
