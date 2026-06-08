import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function deleteGalleryIfExists(page: Page, title: RegExp) {
  await page.goto("/admin/galerias");
  const link = page.getByRole("link", { name: title });
  if (await link.count()) {
    await link.first().click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.waitForURL("**/admin/galerias");
  }
}

test("galerías: listada con elemento visible y privada con clave", async ({ page }) => {
  await login(page);

  // Limpieza previa (por si una ejecución anterior dejó residuos).
  await deleteGalleryIfExists(page, /Galeria E2E/);
  await deleteGalleryIfExists(page, /Galeria Privada E2E/);

  // Galería listada con un elemento.
  await page.goto("/admin/galerias/nueva");
  await page.fill('input[name="title"]', "Galeria E2E");
  await page.getByRole("checkbox", { name: /Listada/ }).check();
  await page.getByRole("button", { name: /Guardar galería/ }).click();
  await page.waitForURL(/\/admin\/galerias\/[a-z0-9]+$/);

  // Añadir una foto por URL.
  await page.fill('input[name="url"]', "https://example.com/foto-e2e.jpg");
  await page.fill('input[name="caption"]', "Foto E2E");
  await page.getByRole("button", { name: "Añadir", exact: true }).click();
  await expect(page.getByText("Foto E2E").first()).toBeVisible();

  // Visible en el hub y en su página.
  await page.goto("/es/galerias");
  await expect(page.getByRole("link", { name: /Galeria E2E/ })).toBeVisible();
  await page.goto("/es/galerias/galeria-e2e");
  await expect(page.getByRole("heading", { level: 1, name: "Galeria E2E" })).toBeVisible();
  await expect(page.getByText("Foto E2E")).toBeVisible();

  // Galería privada con clave.
  await page.goto("/admin/galerias/nueva");
  await page.fill('input[name="title"]', "Galeria Privada E2E");
  await page.fill('input[name="password"]', "secreto123");
  await page.getByRole("button", { name: /Guardar galería/ }).click();
  await page.waitForURL(/\/admin\/galerias\/[a-z0-9]+$/);

  // En la web pide clave; con la clave correcta da acceso.
  // (reintenta por la propagación sub-segundo de la invalidación de caché tras crear)
  await expect(async () => {
    await page.goto("/es/galerias/galeria-privada-e2e");
    await expect(page.getByRole("heading", { level: 1, name: "Galeria Privada E2E" })).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 10000 });
  await expect(page.getByLabel(/clave/i)).toBeVisible();
  await page.getByLabel(/clave/i).fill("secreto123");
  await page.getByRole("button", { name: "Acceder" }).click();
  await expect(page.getByText("Esta galería aún no tiene contenido.")).toBeVisible();

  // Limpieza.
  await deleteGalleryIfExists(page, /Galeria E2E/);
  await deleteGalleryIfExists(page, /Galeria Privada E2E/);
});
