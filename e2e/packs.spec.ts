import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("admin packs: listar, crear y editar", async ({ page }) => {
  await login(page);

  // Listado muestra packs sembrados
  await page.goto("/admin/packs");
  await expect(page.getByText("Karaoke Fiesta")).toBeVisible();

  // Crear pack
  const stamp = Date.now();
  const name = `Pack E2E ${stamp}`;
  const slug = `pack-e2e-${stamp}`;
  await page.goto("/admin/packs/nuevo");
  await page.fill("#name", name);
  await page.fill("#slug", slug);
  await page.fill("#basePrice", "199.99");
  await page.getByRole("button", { name: "Guardar pack" }).click();

  await page.waitForURL("**/admin/packs");
  await expect(page.getByText(name)).toBeVisible();

  // Editar el pack creado
  await page.getByText(name).click();
  await expect(page.getByRole("heading", { name: /Editar/ })).toBeVisible();
  await page.fill("#basePrice", "250.00");
  await page.getByRole("button", { name: "Guardar pack" }).click();
  await page.waitForURL("**/admin/packs");
  await expect(page.getByText(name)).toBeVisible();
});
