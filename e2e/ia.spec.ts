import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function deleteProviderIfExists(page: Page, name: RegExp) {
  await page.goto("/admin/ia");
  const link = page.getByRole("link", { name });
  if (await link.count()) {
    await link.first().click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.waitForURL("**/admin/ia");
  }
}

test("IA admin: crear un proveedor, verlo y borrarlo", async ({ page }) => {
  await login(page);
  await deleteProviderIfExists(page, /Proveedor E2E/);

  await page.goto("/admin/ia/nuevo");
  await page.fill('input[name="name"]', "Proveedor E2E");
  await page.fill('input[name="model"]', "claude-sonnet-4-6");
  await page.fill('input[name="apiKey"]', "sk-ant-e2e-fake-key");
  // Lo dejamos INACTIVO para no afectar al resto de tests (IA seguiría sin "configurada").
  await page.getByRole("checkbox", { name: /Usar este proveedor/ }).uncheck();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL("**/admin/ia");

  await expect(page.getByText("Proveedor E2E")).toBeVisible();
  await expect(page.getByText("Anthropic (Claude) · claude-sonnet-4-6")).toBeVisible();

  // Limpieza.
  await deleteProviderIfExists(page, /Proveedor E2E/);
  await expect(page.getByText("Proveedor E2E")).toHaveCount(0);
});
