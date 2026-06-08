import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function importFile(page: Page, path: string) {
  const name = path.split("/").pop()!;
  await page.goto("/admin/canciones");
  await page.setInputFiles('input[type="file"]', path);
  await page.getByRole("button", { name: "Subir e importar" }).click();
  // Espera a que el panel muestre el trabajo de ESTE fichero y que termine
  // (evita confundirse con un "Completada" de un trabajo anterior).
  await expect(page.getByText(name)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Completada")).toBeVisible({ timeout: 30000 });
}

test("canciones: subir CSV importa, publica y genera PDF", async ({ page }) => {
  await login(page);
  await importFile(page, "e2e/fixtures/songs.csv");

  // Catálogo público muestra la canción importada.
  await page.goto("/es/canciones");
  await expect(page.getByText("Cancion Prueba E2E")).toBeVisible();

  // PDF del repertorio por idioma.
  const res = await page.request.get("/es/canciones/pdf?lang=ES");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect((await res.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // Export CSV del admin.
  const csv = await page.request.get("/admin/canciones/export?format=csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Cancion Prueba E2E");

  // Limpieza: reimportar catálogo vacío → la web vuelve a mostrar el aviso.
  await importFile(page, "e2e/fixtures/songs-empty.csv");
  await page.goto("/es/canciones");
  await expect(page.getByText("El catálogo de canciones se publicará muy pronto.")).toBeVisible();
});
