import { test, expect } from "@playwright/test";

test("ciudades: el hub lista ciudades y la landing muestra cobertura local", async ({ page }) => {
  // Hub /karaoke
  await page.goto("/es/karaoke");
  await expect(page.getByRole("heading", { level: 1, name: /Alquiler de karaoke por ciudades/ })).toBeVisible();
  await expect(page.getByText("Comunidad de Madrid")).toBeVisible();

  // Entrar en la landing de Madrid desde el hub.
  await page.getByRole("link", { name: /^Madrid/ }).first().click();
  await expect(page).toHaveURL(/\/es\/karaoke\/madrid/);
  await expect(page.getByRole("heading", { level: 1, name: /Alquiler de karaoke en Madrid/ })).toBeVisible();

  // Contenido local único: región + una población cercana real.
  await expect(page.getByText("Getafe")).toBeVisible();

  // Breadcrumb vuelve al hub.
  await page.getByRole("link", { name: "Ciudades", exact: true }).first().click();
  await expect(page).toHaveURL(/\/es\/karaoke$/);
});
