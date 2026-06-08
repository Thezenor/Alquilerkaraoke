import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

async function deleteCityIfExists(page: Page, name: RegExp) {
  await page.goto("/admin/ciudades");
  const link = page.getByRole("link", { name });
  if (await link.count()) {
    await link.first().click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.waitForURL("**/admin/ciudades");
  }
}

test("ciudades admin: crear una ciudad la publica en la web y se puede borrar", async ({ page }) => {
  await login(page);
  await deleteCityIfExists(page, /Granada/);

  // Crear ciudad nueva.
  await page.goto("/admin/ciudades/nueva");
  await page.fill('input[name="name"]', "Granada");
  await page.fill('input[name="province"]', "Granada");
  await page.fill('input[name="region"]', "Andalucía");
  await page.fill('textarea[name="nearby"]', "Motril\nBaza\nLoja");
  await page.fill('input[name="population"]', "232000");
  await page.fill('textarea[name="intro"]', "Intro personalizada E2E para Granada.");
  await page.fill('textarea[name="body"]', "## Karaoke en Granada\n\nContenido unico editorial E2E.");
  await page.getByRole("button", { name: /Guardar ciudad/ }).click();

  // Vuelve al listado con la ciudad creada.
  await page.waitForURL("**/admin/ciudades");
  await expect(page.getByText("Granada", { exact: false }).first()).toBeVisible();

  // Aparece en el hub público y en su landing con la cobertura local.
  await page.goto("/es/karaoke");
  await expect(page.getByRole("link", { name: /^Granada/ })).toBeVisible();

  await page.goto("/es/karaoke/granada");
  await expect(page.getByRole("heading", { level: 1, name: /Alquiler de karaoke en Granada/ })).toBeVisible();
  await expect(page.getByText("Motril").first()).toBeVisible();
  // El contenido propio sustituye a la plantilla y aparece el bloque editorial único.
  await expect(page.getByText("Intro personalizada E2E para Granada.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Karaoke en Granada", exact: true })).toBeVisible();

  // En la edición, el botón de IA existe y, sin clave, informa de que no está configurada.
  await page.goto("/admin/ciudades");
  await page.getByRole("link", { name: /Granada/ }).first().click();
  await page.getByRole("button", { name: /Generar con IA/ }).click();
  await expect(page.getByText(/IA no configurada/)).toBeVisible();

  // Limpieza: borrar la ciudad creada.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.waitForURL("**/admin/ciudades");

  // Ya no está en la web.
  await page.goto("/es/karaoke/granada");
  await expect(page.getByRole("heading", { level: 1, name: /Alquiler de karaoke en Granada/ })).toHaveCount(0);
});
