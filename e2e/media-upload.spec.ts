import { test, expect, type Page } from "@playwright/test";

// PNG 1x1 válido (se optimizará a WebP en el servidor).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

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

test("media: subir imagen desde el admin la optimiza y la sirve por /media", async ({ page }) => {
  await login(page);
  await deleteEventIfExists(page, /Media Test E2E/);

  await page.goto("/admin/eventos/nuevo");
  await page.fill('input[name="name"]', "Media Test E2E");

  // Subir el archivo: el componente lo envía a /admin/media/upload y rellena el campo.
  await page.setInputFiles('input[type="file"]', { name: "foto.png", mimeType: "image/png", buffer: PNG_1x1 });
  const heroInput = page.locator('input[name="heroImageUrl"]');
  await expect(heroInput).toHaveValue(/\/media\/.+\.webp$/, { timeout: 15000 });
  const mediaUrl = await heroInput.inputValue();

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL("**/admin/eventos");

  // La página pública muestra la imagen (next/image la sirve vía /_next/image?url=/media/…).
  await page.goto("/es/eventos/media-test-e2e");
  const img = page.locator(`img[src*="${encodeURIComponent(mediaUrl)}"]`).first();
  await expect(img).toBeVisible();
  const optimized = await page.request.get((await img.getAttribute("src"))!);
  expect(optimized.status()).toBe(200);

  // El original optimizado a WebP se sigue sirviendo por /media.
  const res = await page.request.get(mediaUrl);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/webp");

  await deleteEventIfExists(page, /Media Test E2E/);
});
