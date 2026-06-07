import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("admin: crear extra y editar suplemento de una zona", async ({ page }) => {
  await login(page);

  // Crear extra
  const stamp = Date.now();
  const name = `Extra E2E ${stamp}`;
  await page.goto("/admin/extras/nuevo");
  await page.fill("#name", name);
  await page.fill("#slug", `extra-e2e-${stamp}`);
  await page.fill("#price", "12.50");
  await page.getByRole("button", { name: "Guardar extra" }).click();
  await page.waitForURL("**/admin/extras");
  await expect(page.getByText(name)).toBeVisible();

  // Editar suplemento de Zona 2
  await page.goto("/admin/tarifas");
  const zona = page.locator("li", { hasText: "Zona 2" });
  await zona.locator('input[name="supplement"]').fill("130");
  await zona.getByRole("button", { name: "Guardar" }).click();
  await expect(zona.locator('input[name="supplement"]')).toHaveValue("130.00");
});
