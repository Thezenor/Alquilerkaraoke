import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateBudget, isWeekend, matchSurcharge, type BudgetInput } from "./budget";

const base: BudgetInput = {
  basePrice: 10000,
  isPerDay: false,
  includedHours: 4,
  extraHourPrice: 6000,
  hours: 4,
  provinceSupplement: 0,
  extras: [],
  surchargePercents: [],
  vatPercent: 21,
  discountPercent: 0,
  depositType: "PERCENT",
  depositValue: 30,
  securityDeposit: 5000,
};

test("caso simple: base + IVA + reserva 30%", () => {
  const b = calculateBudget(base);
  assert.equal(b.subtotal, 10000);
  assert.equal(b.vat, 2100);
  assert.equal(b.total, 12100);
  assert.equal(b.deposit, 3630);
  assert.equal(b.securityDeposit, 5000);
});

test("horas extra solo cuentan por encima de las incluidas", () => {
  const b = calculateBudget({ ...base, hours: 6 }); // 2 extra * 6000
  assert.equal(b.extraHours, 12000);
  assert.equal(b.subtotal, 22000);
});

test("isPerDay ignora horas extra", () => {
  const b = calculateBudget({ ...base, isPerDay: true, hours: 12 });
  assert.equal(b.extraHours, 0);
});

test("provincia, extras, suplemento %, descuento, IVA y reserva", () => {
  const b = calculateBudget({
    ...base,
    basePrice: 29000,
    hours: 6,
    provinceSupplement: 4000,
    extras: [5000, 3000],
    surchargePercents: [15],
    discountPercent: 10,
  });
  assert.equal(b.extraHours, 12000);
  assert.equal(b.province, 4000);
  assert.equal(b.extras, 8000);
  assert.equal(b.surcharges, 7950); // 15% de 53000
  assert.equal(b.subtotal, 60950);
  assert.equal(b.discount, 6095);
  assert.equal(b.taxableBase, 54855);
  assert.equal(b.vat, 11520);
  assert.equal(b.total, 66375);
  assert.equal(b.deposit, 19913);
});

test("reserva fija no supera el total", () => {
  const b = calculateBudget({ ...base, depositType: "FIXED", depositValue: 999999 });
  assert.equal(b.deposit, b.total);
});

test("reserva en % se capa al total si el porcentaje supera 100", () => {
  const b = calculateBudget({ ...base, depositType: "PERCENT", depositValue: 150 });
  assert.equal(b.deposit, b.total);
});

test("valores negativos se tratan como cero", () => {
  const b = calculateBudget({ ...base, hours: 1 }); // menos de las incluidas
  assert.equal(b.extraHours, 0);
});

test("isWeekend detecta sábado y domingo", () => {
  assert.equal(isWeekend("2026-06-06"), true); // sábado
  assert.equal(isWeekend("2026-06-07"), true); // domingo
  assert.equal(isWeekend("2026-06-08"), false); // lunes
});

test("suplementos fijos se suman a los porcentuales", () => {
  const b = calculateBudget({ ...base, surchargePercents: [10], surchargeFixed: [2000, 500] });
  // 10% de 10000 = 1000 + 2500 fijo = 3500
  assert.equal(b.surcharges, 3500);
  assert.equal(b.subtotal, 13500);
});

test("matchSurcharge: WEEKEND aplica en sábado/domingo, no en laborable", () => {
  const s = { type: "WEEKEND" };
  assert.equal(matchSurcharge(s, { date: "2026-06-06", night: false }), true); // sábado
  assert.equal(matchSurcharge(s, { date: "2026-06-08", night: false }), false); // lunes
});

test("matchSurcharge: WEEKEND respeta config.weekdays personalizada", () => {
  const s = { type: "WEEKEND", config: { weekdays: [5, 6, 0] } }; // viernes incluido
  assert.equal(matchSurcharge(s, { date: "2026-06-05", night: false }), true); // viernes
  assert.equal(matchSurcharge(s, { date: "2026-06-04", night: false }), false); // jueves
});

test("matchSurcharge: NIGHT depende del flag night", () => {
  const s = { type: "NIGHT" };
  assert.equal(matchSurcharge(s, { date: "2026-06-08", night: true }), true);
  assert.equal(matchSurcharge(s, { date: "2026-06-08", night: false }), false);
});

test("matchSurcharge: SPECIAL_DATE mode single coincide solo en la fecha", () => {
  const s = { type: "SPECIAL_DATE", config: { mode: "single", date: "2026-12-31" } };
  assert.equal(matchSurcharge(s, { date: "2026-12-31", night: false }), true);
  assert.equal(matchSurcharge(s, { date: "2026-12-30", night: false }), false);
});

test("matchSurcharge: mode range incluye los extremos", () => {
  const s = { type: "HIGH_DEMAND", config: { mode: "range", from: "2026-08-01", to: "2026-08-31" } };
  assert.equal(matchSurcharge(s, { date: "2026-08-01", night: false }), true);
  assert.equal(matchSurcharge(s, { date: "2026-08-31", night: false }), true);
  assert.equal(matchSurcharge(s, { date: "2026-09-01", night: false }), false);
});

test("matchSurcharge: sin config aplicable no se aplica automáticamente", () => {
  assert.equal(matchSurcharge({ type: "OTHER" }, { date: "2026-06-08", night: false }), false);
  assert.equal(matchSurcharge({ type: "EXTERIOR" }, { date: "2026-06-08", night: true }), false);
});
