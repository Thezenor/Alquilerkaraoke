import { test, expect } from "@playwright/test";

test("presupuesto: calcular un presupuesto orientativo", async ({ page }) => {
  await page.goto("/es/presupuesto");
  await expect(page.getByRole("heading", { name: "Calcula tu presupuesto" })).toBeVisible();

  // El select de pack ya tiene opciones (packs sembrados); usamos el primero por defecto.
  await page.fill("#hours", "6");
  await page.getByRole("button", { name: "Calcular presupuesto" }).click();

  await expect(page.getByRole("heading", { name: "Presupuesto orientativo" })).toBeVisible();
  // Tras calcular aparece el bloque de datos para solicitar la reserva.
  await expect(page.getByRole("button", { name: "Enviar solicitud de reserva" })).toBeVisible();
});
