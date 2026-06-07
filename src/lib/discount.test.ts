import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateDiscountCode, normalizeCode, type DiscountCodeRecord } from "./discount";

const base: DiscountCodeRecord = {
  valueType: "PERCENT",
  value: 10,
  isActive: true,
  maxUses: null,
  usedCount: 0,
  validFromMs: null,
  validUntilMs: null,
};
const NOW = 1_000_000;

test("código porcentual válido devuelve percent", () => {
  const r = evaluateDiscountCode(base, { nowMs: NOW });
  assert.deepEqual(r, { valid: true, percent: 10, fixed: 0 });
});

test("código fijo válido devuelve fixed", () => {
  const r = evaluateDiscountCode({ ...base, valueType: "FIXED", value: 5000 }, { nowMs: NOW });
  assert.deepEqual(r, { valid: true, percent: 0, fixed: 5000 });
});

test("inactivo, caducado, no-iniciado y agotado son inválidos", () => {
  assert.equal(evaluateDiscountCode({ ...base, isActive: false }, { nowMs: NOW }).valid, false);
  assert.equal(evaluateDiscountCode({ ...base, validUntilMs: NOW - 1 }, { nowMs: NOW }).valid, false);
  assert.equal(evaluateDiscountCode({ ...base, validFromMs: NOW + 1 }, { nowMs: NOW }).valid, false);
  assert.equal(evaluateDiscountCode({ ...base, maxUses: 5, usedCount: 5 }, { nowMs: NOW }).valid, false);
});

test("percent se capa a 100", () => {
  assert.equal(evaluateDiscountCode({ ...base, value: 150 }, { nowMs: NOW }).percent, 100);
});

test("normalizeCode pasa a mayúsculas y quita espacios", () => {
  assert.equal(normalizeCode("  verano 24 "), "VERANO24");
});
