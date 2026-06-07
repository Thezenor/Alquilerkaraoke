import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContractPdf, type ContractPdfData } from "../server/pdf/contract";
import { computeContentHash } from "../server/contracts";

const base: ContractPdfData = {
  number: "CON-2026-ABC123",
  date: "07/06/2026",
  company: { name: "Alquiler Karaoke", taxId: "B12345678", phone: "607724965" },
  customer: { name: "Ana Pérez", email: "ana@example.com", phone: "600111222" },
  event: { packName: "Pack Fiesta", eventDate: "31/12/2026", province: "Madrid", hours: 6, night: true },
  total: 32670,
  deposit: 9801,
  terms: "1. OBJETO. Cláusula de prueba.\n\n2. PAGO. Otra cláusula con acentos: ñ á é í ó ú €.",
  signed: null,
};

test("buildContractPdf (sin firma) devuelve un PDF válido", async () => {
  const bytes = await buildContractPdf(base);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString("latin1"), "%PDF-");
});

test("buildContractPdf (firmado) embebe los datos de firma sin lanzar", async () => {
  const bytes = await buildContractPdf({
    ...base,
    signed: { name: "Ana Pérez", at: "07/06/2026 18:00", ip: "1.2.3.4", hash: "abc123", image: null },
  });
  assert.ok(bytes.length > 800);
});

test("computeContentHash es determinista y cambia con el contenido", () => {
  const a = computeContentHash({ number: "X", terms: "T", total: 100, signedName: "Ana", signedAtIso: "2026-01-01T00:00:00Z" });
  const b = computeContentHash({ number: "X", terms: "T", total: 100, signedName: "Ana", signedAtIso: "2026-01-01T00:00:00Z" });
  const c = computeContentHash({ number: "X", terms: "T", total: 200, signedName: "Ana", signedAtIso: "2026-01-01T00:00:00Z" });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[a-f0-9]{64}$/);
});
