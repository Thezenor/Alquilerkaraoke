import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("calendario: crear recargo recurrente y verlo en recargos", async ({ page }) => {
  await login(page);

  // El calendario renderiza la rejilla del mes.
  await page.goto("/admin/calendario");
  await expect(page.getByRole("heading", { name: "Calendario" })).toBeVisible();
  await expect(page.getByText("Lun")).toBeVisible();

  // Crear un recargo recurrente desde la página de recargos.
  const stamp = Date.now();
  const name = `Recargo E2E ${stamp}`;
  await page.goto("/admin/recargos");
  await page.fill('input[name="name"]', name);
  await page.selectOption('select[name="type"]', "WEEKEND");
  await page.fill('input[name="value"]', "12");
  await page.getByRole("button", { name: "Crear recargo recurrente" }).click();

  await expect(page.getByText(name)).toBeVisible();
  const row = page.locator("li", { hasText: name });
  await expect(row.getByText("+12%")).toBeVisible();

  // Eliminar para no dejar residuo.
  await row.getByRole("button", { name: "Eliminar recargo" }).click();
  await expect(page.getByText(name)).toHaveCount(0);
});
