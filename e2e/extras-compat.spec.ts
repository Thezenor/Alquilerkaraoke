import { test, expect } from "@playwright/test";

// Verifica que los extras se filtran según el pack seleccionado:
// los extras Holi solo aparecen con un pack de "Fiesta Holi".
test("extras condicionados: Holi solo con packs Holi", async ({ page }) => {
  await page.goto("/es/presupuesto");

  const packSelect = page.locator("#packId");
  const holiExtra = page.getByText("100 bolsas de color Holi", { exact: false });

  // Selecciona un pack de Karaoke → no deben verse extras Holi.
  await packSelect.selectOption({ label: "Karaoke Opción 1" });
  await expect(holiExtra).toHaveCount(0);

  // Selecciona un pack Holi → aparecen los extras Holi.
  await packSelect.selectOption({ label: "Holi 1 (Evento Pequeño)" });
  await expect(holiExtra).toBeVisible();
});
