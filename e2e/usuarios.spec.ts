import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

test("usuarios: superadmin crea un usuario y ese usuario inicia sesión", async ({ page }) => {
  const stamp = Date.now();
  const email = `staff_${stamp}@example.com`;
  const password = "Staff_pass_2026";

  // Superadmin crea el usuario
  await loginAs(page, "admin@alquilerkaraoke.com", "Admin_dev_2026!");
  await page.waitForURL("**/admin");
  await page.goto("/admin/usuarios/nuevo");
  await page.fill("#name", `Staff ${stamp}`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.check('input[name="roles"][value="COMERCIAL"]');
  await page.getByRole("button", { name: "Guardar usuario" }).click();
  await page.waitForURL("**/admin/usuarios");
  await expect(page.getByText(email)).toBeVisible();

  // Cerrar sesión y entrar como el nuevo usuario
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("**/admin/login");
  await loginAs(page, email, password);
  await page.waitForURL("**/admin");
  await expect(page).toHaveURL(/\/admin$/);
});
