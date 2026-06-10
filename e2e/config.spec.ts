import { test, expect } from "@playwright/test";

const EMAIL = "admin@alquilerkaraoke.com";
const PASSWORD = "Admin_dev_2026!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
}

test("guardar configuración de empresa y reflejarse en la web pública", async ({ page }) => {
  await login(page);

  // Ir a Configuración
  await page.goto("/admin/configuracion");
  await expect(page.getByRole("heading", { name: "Configuración de empresa" })).toBeVisible();

  // Cambiar teléfono a un valor de prueba y guardar
  await page.locator("#phone").fill("600111222");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();

  // La web pública debe reflejar el nuevo teléfono (revalidación por tag)
  await page.goto("/es");
  await expect(page.locator('a[href="https://wa.me/34600111222"]').first()).toBeVisible();

  // Restaurar el teléfono original para dejar la BD limpia
  await page.goto("/admin/configuracion");
  await page.locator("#phone").fill("607724965");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();
});

test("la configuración exige sesión", async ({ page }) => {
  await page.goto("/admin/configuracion");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("redes sociales del admin aparecen en el pie de página", async ({ page }) => {
  const url = `https://instagram.com/akaraoke_${Date.now()}`;
  await login(page);
  await page.goto("/admin/configuracion");
  await page.locator("#instagram").fill(url);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();

  // Aparece en el footer de una página dinámica (revalidación por tag).
  await page.goto("/es/packs");
  await expect(page.locator(`a[href="${url}"]`)).toBeVisible();

  // Limpieza.
  await page.goto("/admin/configuracion");
  await page.locator("#instagram").fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();
});

test("Google Analytics configurado se inyecta en la web pública", async ({ page }) => {
  await login(page);
  await page.goto("/admin/configuracion");
  await page.locator("#gaMeasurementId").fill("G-E2ETEST123");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();

  // RGPD: sin consentimiento no se carga ningún script de terceros.
  await page.goto("/es");
  await expect(page.getByRole("button", { name: "Aceptar", exact: true })).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);

  // Al aceptar las cookies de analítica desde el banner, GA se activa sin recargar.
  await page.getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js?id=G-E2ETEST123"]')).toHaveCount(1);

  // Limpieza: quitar el ID.
  await page.goto("/admin/configuracion");
  await page.locator("#gaMeasurementId").fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Configuración guardada correctamente.")).toBeVisible();
  await page.goto("/es");
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
});

test("FAQ accesible y enlazada desde el pie", async ({ page }) => {
  await page.goto("/es/faq");
  await expect(page.getByRole("heading", { name: "Preguntas frecuentes", level: 1 })).toBeVisible();
  await page.goto("/es/packs");
  await expect(page.locator('footer a[href="/es/faq"]')).toBeVisible();
});
