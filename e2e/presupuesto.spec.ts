import { test, expect } from "@playwright/test";

test("presupuesto: solicitar (se envía por email, sin mostrar precio)", async ({ page }) => {
  await page.goto("/es/presupuesto");
  await expect(page.getByRole("heading", { name: "Pide tu presupuesto" })).toBeVisible();

  await page.fill("#hours", "5");
  await page.fill("#name", "Test Presupuesto");
  await page.fill("#email", `presu_${Date.now()}@example.com`);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();

  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();
});
