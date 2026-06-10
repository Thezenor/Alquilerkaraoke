import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bookingCustomerEmail,
  bookingAdminEmail,
  bookingConfirmedEmail,
  bookingDeclinedEmail,
  contactAdminEmail,
  contractSignedCustomerEmail,
  contractSignedAdminEmail,
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

test("email de confirmación incluye estado, evento e importes", () => {
  const { subject, html } = bookingConfirmedEmail({
    ...data,
    payment: { iban: "ES12 3456", bizum: "600111222", info: null },
  });
  assert.match(subject, /Reserva confirmada/);
  assert.match(html, /confirmada/);
  assert.match(html, /2026-12-31/);
  assert.match(html, /Total/);
  assert.match(html, /Próximos pasos/);
  assert.match(html, /ES12 3456/);
});

test("email de rechazo/cancelación usa tono cuidado y no incluye precios", () => {
  const rejected = bookingDeclinedEmail({ ...data, reason: "REJECTED" });
  assert.match(rejected.subject, /Sobre tu reserva/);
  assert.match(rejected.html, /no podemos confirmar/);
  const cancelled = bookingDeclinedEmail({ ...data, reason: "CANCELLED" });
  assert.match(cancelled.subject, /Reserva cancelada/);
  assert.match(cancelled.html, /cancelada/);
});

test("emails de contrato firmado incluyen número, enlace y CTA admin", () => {
  const signed = {
    customerName: "Ana Pérez",
    packName: "Pack Fiesta",
    number: "CON-2026-ABC123",
    signedAt: "2026-06-10 18:30",
    contractUrl: "https://x/contrato/tok123",
    eventDate: "2026-12-31",
    email: "ana@example.com",
  };
  const customer = contractSignedCustomerEmail(signed);
  assert.match(customer.subject, /CON-2026-ABC123/);
  assert.match(customer.html, /contrato\/tok123/);
  const admin = contractSignedAdminEmail({ ...signed, adminUrl: "https://x/admin/reservas/abc" });
  assert.match(admin.subject, /Ana Pérez/);
  assert.match(admin.html, /\/admin\/reservas\/abc/);
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
