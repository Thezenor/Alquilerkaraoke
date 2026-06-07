import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProformaPdf, type ProformaData } from "../server/pdf/proforma";

const data: ProformaData = {
  number: "PRE-2026-ABC123",
  date: "07/06/2026",
  company: { name: "Alquiler Karaoke", taxId: "B12345678", phone: "607724965" },
  customer: { name: "José Núñez", email: "jose@example.com", phone: "600111222" },
  event: { packName: "Pack Fiesta", eventDate: "31/12/2026", province: "Madrid", hours: 6, night: true },
  extras: [{ name: "Máquina de humo", price: 5000 }],
  amounts: { subtotal: 30000, discount: 3000, vat: 5670, total: 32670, deposit: 9801, securityDeposit: 5000, amountPaid: 0 },
  payment: { iban: "ES00 0000 0000 0000", bizum: "607724965", info: "Indica tu nombre en el concepto." },
  paymentStatusLabel: "Sin pagar",
};

test("buildProformaPdf devuelve un PDF válido (cabecera %PDF)", async () => {
  const bytes = await buildProformaPdf(data);
  assert.ok(bytes.length > 800, "el PDF debería tener contenido");
  const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
  assert.equal(header, "%PDF-");
});

test("buildProformaPdf maneja caracteres no Latin-1 sin lanzar", async () => {
  const bytes = await buildProformaPdf({
    ...data,
    customer: { name: "Test 🎤 Emoji ✨", email: "x@example.com", phone: null },
    extras: [{ name: "Confeti 🎉", price: 1000 }],
  });
  assert.ok(bytes.length > 800);
});
