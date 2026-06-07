import { test } from "node:test";
import assert from "node:assert/strict";
import { derivePaymentStatus, amountDue } from "./payments";

test("derivePaymentStatus: sin cobros → PENDING", () => {
  assert.equal(derivePaymentStatus(0, 10000), "PENDING");
});

test("derivePaymentStatus: cobro parcial → PARTIAL", () => {
  assert.equal(derivePaymentStatus(3000, 10000), "PARTIAL");
});

test("derivePaymentStatus: cobro igual o mayor al total → PAID", () => {
  assert.equal(derivePaymentStatus(10000, 10000), "PAID");
  assert.equal(derivePaymentStatus(12000, 10000), "PAID");
});

test("derivePaymentStatus: total 0 nunca es PAID por defecto", () => {
  assert.equal(derivePaymentStatus(0, 0), "PENDING");
});

test("derivePaymentStatus: reembolso que deja saldo ≤ 0 → PENDING", () => {
  assert.equal(derivePaymentStatus(0, 10000), "PENDING");
  assert.equal(derivePaymentStatus(-500, 10000), "PENDING");
});

test("amountDue: pendiente nunca negativo", () => {
  assert.equal(amountDue(3000, 10000), 7000);
  assert.equal(amountDue(12000, 10000), 0);
});
