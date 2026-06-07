import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

test("usuarios: superadmin crea un usuario y ese usuario inicia sesión", async ({ page, browser }) => {
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

  // El nuevo usuario inicia sesión en un contexto/navegador limpio (sesión aislada)
  const ctx = await browser.newContext();
  const page2 = await ctx.newPage();
  await loginAs(page2, email, password);
  await page2.waitForURL("**/admin");
  await expect(page2).toHaveURL(/\/admin$/);
  await ctx.close();
});
