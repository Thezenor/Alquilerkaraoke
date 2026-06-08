import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#email", "admin@alquilerkaraoke.com");
  await page.fill("#password", "Admin_dev_2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("segunda actividad: se añade y queda registrada en la reserva", async ({ page }) => {
  const stamp = Date.now();
  const name = `Multi ${stamp}`;

  await page.goto("/es/presupuesto");
  // Pack principal.
  await page.locator("#packId").selectOption({ label: "Karaoke Opción 1" });
  // Añadir una segunda actividad.
  await page.getByRole("button", { name: "Añadir otra actividad" }).click();
  await expect(page.getByText("Actividad 2")).toBeVisible();
  // La segunda actividad usa su propio selector de pack (el 2º select de pack del form).
  await page.locator('select[aria-label="Pack"]').first().selectOption({ label: "Consolas Opción 1" });

  await page.fill("#name", name);
  await page.fill("#email", `multi_${stamp}@example.com`);
  await page.check('input[name="acceptedTerms"]');
  await page.getByRole("button", { name: "Solicitar presupuesto" }).click();
  await expect(page.getByRole("heading", { name: "¡Solicitud enviada!" })).toBeVisible();

  // En el admin, la reserva muestra ambas actividades.
  await login(page);
  await page.goto("/admin/reservas");
  await page.getByText(name).click();
  await page.waitForURL(/\/admin\/reservas\/[^/]+$/);
  await expect(page.getByText("Actividades")).toBeVisible();
  await expect(page.getByText("Karaoke Opción 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Consolas Opción 1", { exact: true })).toBeVisible();
});
