import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bookingCustomerEmail,
  bookingAdminEmail,
  contactAdminEmail,
  type BookingEmailData,
} from "../server/email/templates";
import { calculateBudget } from "./budget";

const breakdown = calculateBudget({
  basePrice: 29000,
  isPerDay: false,
  includedHours: 4,
  extraHourPrice: 6000,
  hours: 6,
  provinceSupplement: 4000,
  extras: [5000],
  surchargePercents: [15],
  surchargeFixed: [],
  vatPercent: 21,
  discountPercent: 10,
  depositType: "PERCENT",
  depositValue: 30,
  securityDeposit: 5000,
});

const data: BookingEmailData & { email: string } = {
  customerName: "Ana Pérez",
  packName: "Pack Fiesta",
  hours: 6,
  eventDate: "2026-12-31",
  province: "Madrid",
  extras: [{ name: "Humo", price: 5000 }],
  breakdown,
  email: "ana@example.com",
  phone: "600111222",
};

test("email cliente incluye pack, fecha, total y reserva", () => {
  const { subject, html } = bookingCustomerEmail(data);
  assert.match(subject, /Pack Fiesta/);
  assert.match(html, /Ana Pérez/);
  assert.match(html, /2026-12-31/);
  assert.match(html, /Total/);
  assert.match(html, /Reserva para confirmar/);
});

test("email admin incluye contacto, total en asunto y CTA al panel", () => {
  const { subject, html } = bookingAdminEmail({ ...data, adminUrl: "https://x/admin/reservas/abc" });
  assert.match(subject, /Nueva reserva · Ana Pérez/);
  assert.match(html, /ana@example.com/);
  assert.match(html, /\/admin\/reservas\/abc/);
});

test("email de contacto escapa HTML del mensaje (anti-inyección)", () => {
  const { html } = contactAdminEmail({
    name: "Bot",
    email: "b@example.com",
    phone: null,
    city: null,
    message: "<script>alert(1)</script>",
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});
