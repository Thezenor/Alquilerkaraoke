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

  // Ordenar por intérprete (conserva resultados).
  await page.getByRole("link", { name: "Intérprete", exact: true }).click();
  await expect(page).toHaveURL(/sort=performer/);
  await expect(page.getByText("Cancion Prueba E2E")).toBeVisible();

  // Filtro por banderas: Español (10) sale como bandera; el inglés (1, <10) va a
  // "Sin clasificar". Al filtrar por "Sin clasificar" solo aparece la canción inglesa.
  await expect(page.getByRole("link", { name: /Español/ })).toBeVisible();
  const other = page.getByRole("link", { name: /Sin clasificar/ });
  await expect(other).toBeVisible();
  await other.click();
  await expect(page.getByText("Test Song E2E")).toBeVisible();
  await expect(page.getByText("Cancion Prueba E2E")).toHaveCount(0);

  // PDF del repertorio por idioma.
  const res = await page.request.get("/es/canciones/pdf?lang=ES");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect((await res.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

  // Export CSV del admin.
  const csv = await page.request.get("/admin/canciones/export?format=csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Cancion Prueba E2E");

  // Admin de canciones: estadísticas y contadores por marca.
  await page.goto("/admin/canciones");
  await expect(page.getByText("Duplicados ocultos")).toBeVisible();
  await expect(page.locator('input[value="KaraokeMedia"]')).toBeVisible();
  await expect(page.getByText(/canciones · /).first()).toBeVisible();

  // Limpieza: reimportar catálogo vacío → la web vuelve a mostrar el aviso.
  await importFile(page, "e2e/fixtures/songs-empty.csv");
  await page.goto("/es/canciones");
  await expect(page.getByText("El catálogo de canciones se publicará muy pronto.")).toBeVisible();
});
