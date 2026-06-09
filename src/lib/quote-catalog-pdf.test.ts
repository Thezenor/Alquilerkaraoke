import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuoteCatalogPdf, type QuoteCatalogData } from "../server/pdf/quote-catalog";
import { calculateBudget } from "./budget";

const data: QuoteCatalogData = {
  number: "PRE-2026-ABC123",
  date: "09/06/2026",
  company: {
    name: "Alquiler Karaoke",
    legalName: "Karaoke Machines S.L.",
    taxId: "B12345678",
    phone: "607724965",
    email: "info@alquilerkaraoke.com",
    web: "www.alquilerkaraoke.com",
    iban: "ES70 0081 0250 92",
    whatsapp: "607724965",
    instagram: "https://instagram.com/alquilerkaraoke",
  },
  customer: { name: "José Núñez", email: "jose@example.com", phone: "600111222" },
  event: { eventDate: "31/12/2026", province: "Madrid", eventTime: "20:00" },
  lines: [
    {
      name: "Opción 2 · Karaoke",
      description: "Equipo de 2.400 W\n2 pantallas de 55\"\n2 micrófonos inalámbricos\nGrabación de actuaciones",
      hours: 4,
      lineTotal: 75000,
    },
    { name: "Opción Furor", description: "Producción completa\n8 micrófonos\n2 animadores", hours: 4, lineTotal: 180000 },
  ],
  amounts: { subtotal: 255000, vat: 53550, total: 308550, deposit: 154275, vatPercent: 21 },
  depositPercent: 50,
  terms: "1. Objeto. Texto de condiciones.\n\nMUY IMPORTANTE\n- Exija su factura.",
  termsHeading: "CONDICIONES DE LA RESERVA",
};

test("buildQuoteCatalogPdf devuelve un PDF válido (cabecera %PDF)", async () => {
  const bytes = await buildQuoteCatalogPdf(data);
  assert.ok(bytes.length > 1500, "el PDF debería tener contenido");
  const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
  assert.equal(header, "%PDF-");
});

test("buildQuoteCatalogPdf maneja caracteres no Latin-1 y emojis sin lanzar", async () => {
  const bytes = await buildQuoteCatalogPdf({
    ...data,
    customer: { name: "Test 🎤 Emoji ✨", email: "x@example.com", phone: null },
    lines: [{ name: "Karaoke 🎉", description: "Línea 1\nLínea 2", hours: null, lineTotal: 50000 }],
  });
  assert.ok(bytes.length > 1500);
});

test("buildQuoteCatalogPdf funciona sin líneas (fallback al subtotal)", async () => {
  const bytes = await buildQuoteCatalogPdf({ ...data, lines: [] });
  assert.ok(bytes.length > 1500);
});

test("el cálculo de importes del presupuesto manual usa calculateBudget", () => {
  // 2 líneas (750 € + 1800 €) + suplemento de provincia (50 €), IVA 21%, señal 50%.
  const breakdown = calculateBudget({
    basePrice: 75000 + 180000,
    isPerDay: true,
    includedHours: 0,
    extraHourPrice: 0,
    hours: 0,
    provinceSupplement: 5000,
    extras: [],
    surchargePercents: [],
    surchargeFixed: [],
    vatPercent: 21,
    discountPercent: 0,
    depositType: "PERCENT",
    depositValue: 50,
    securityDeposit: 0,
  });
  assert.equal(breakdown.subtotal, 260000);
  assert.equal(breakdown.vat, 54600);
  assert.equal(breakdown.total, 314600);
  assert.equal(breakdown.deposit, 157300);
});
