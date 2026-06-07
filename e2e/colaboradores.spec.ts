import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("colaboradores: crear en admin y verlo en la home", async ({ page }) => {
  const stamp = Date.now();
  const name = `Marca E2E ${stamp}`;

  await login(page);
  await page.goto("/admin/colaboradores/nuevo");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="url"]', "https://example.com");
  await page.getByRole("button", { name: "Guardar colaborador" }).click();
  await page.waitForURL("**/admin/colaboradores");
  await expect(page.getByText(name)).toBeVisible();

  // Aparece en la home pública (sección Colaboradores).
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();
  await expect(page.getByTitle(name)).toBeVisible();

  // Limpieza: eliminar.
  await page.goto("/admin/colaboradores");
  await page.getByText(name).click();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.waitForURL("**/admin/colaboradores");
  await expect(page.getByText(name)).toHaveCount(0);
});
