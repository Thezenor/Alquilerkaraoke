// Plantillas de email (funciones PURAS: sin BD ni I/O). Devuelven { subject, html }.
import { formatCents } from "../../lib/money";
import type { BudgetBreakdown } from "../../lib/budget";

export type EmailContent = { subject: string; html: string };

const BRAND = "#22d3ee";
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#0b0f14;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #1f2937">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${BRAND};margin-right:8px"></span>
      <strong style="color:#fff;font-size:16px">Alquiler Karaoke</strong>
    </td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 16px;font-size:18px;color:#fff">${esc(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #1f2937;font-size:12px;color:#9ca3af">
      Alquiler Karaoke · 607724965 · www.alquilerkaraoke.com
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string, strong = false): string {
  const v = strong ? `<strong style="color:#fff">${value}</strong>` : value;
  return `<tr>
    <td style="padding:6px 0;color:#9ca3af;font-size:14px">${esc(label)}</td>
    <td style="padding:6px 0;text-align:right;font-size:14px;color:#e5e7eb">${v}</td>
  </tr>`;
}

export type BookingEmailData = {
  customerName: string;
  packName: string;
  hours: number;
  eventDate: string | null; // YYYY-MM-DD o null
  province: string | null;
  extras: { name: string; price: number }[];
  breakdown: BudgetBreakdown;
  adminUrl?: string;
  email?: string;
  phone?: string | null;
};

function summaryTable(d: BookingEmailData): string {
  const lines: string[] = [];
  lines.push(row("Pack", esc(d.packName)));
  if (d.eventDate) lines.push(row("Fecha", d.eventDate));
  lines.push(row("Duración", `${d.hours} h`));
  if (d.province) lines.push(row("Provincia", esc(d.province)));
  if (d.extras.length) lines.push(row("Extras", d.extras.map((e) => esc(e.name)).join(", ")));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${lines.join("")}</table>`;
}

function priceTable(b: BudgetBreakdown): string {
  const lines: string[] = [];
  lines.push(row("Subtotal (sin IVA)", formatCents(b.subtotal)));
  if (b.discount > 0) lines.push(row("Descuento", `– ${formatCents(b.discount)}`));
  lines.push(row("IVA", formatCents(b.vat)));
  lines.push(row("Total", formatCents(b.total), true));
  lines.push(row("Reserva para confirmar", formatCents(b.deposit)));
  if (b.securityDeposit > 0) lines.push(row("Fianza (reembolsable)", formatCents(b.securityDeposit)));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1f2937;margin-top:8px;padding-top:8px">${lines.join("")}</table>`;
}

/** Presupuesto orientativo para el cliente. */
export function bookingCustomerEmail(d: BookingEmailData): EmailContent {
  const body = `
    <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px">
      Hola ${esc(d.customerName)}, gracias por tu solicitud. Este es tu presupuesto orientativo.
      Te contactaremos para confirmar disponibilidad y cerrar los detalles.
    </p>
    ${summaryTable(d)}
    ${priceTable(d.breakdown)}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px">
      Importes con IVA incluido salvo indicación. El presupuesto no constituye una reserva confirmada
      hasta nuestra validación.
    </p>`;
  return { subject: `Tu presupuesto · ${d.packName}`, html: layout("Tu presupuesto", body) };
}

/** Aviso al admin de una nueva reserva. */
export function bookingAdminEmail(d: BookingEmailData): EmailContent {
  const contact = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
    ${row("Cliente", esc(d.customerName))}
    ${d.email ? row("Email", esc(d.email)) : ""}
    ${d.phone ? row("Teléfono", esc(d.phone)) : ""}
  </table>`;
  const cta = d.adminUrl
    ? `<p style="margin:16px 0 0"><a href="${esc(d.adminUrl)}" style="display:inline-block;background:${BRAND};color:#001016;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:8px;font-size:14px">Ver reserva en el panel</a></p>`
    : "";
  const body = `
    <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px">Nueva solicitud de reserva (pendiente de validación).</p>
    ${contact}
    ${summaryTable(d)}
    ${priceTable(d.breakdown)}
    ${cta}`;
  return { subject: `Nueva reserva · ${d.customerName} · ${formatCents(d.breakdown.total)}`, html: layout("Nueva reserva", body) };
}

export type ContactEmailData = {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  message: string;
  adminUrl?: string;
};

/** Aviso al admin de un nuevo lead de contacto. */
export function contactAdminEmail(d: ContactEmailData): EmailContent {
  const cta = d.adminUrl
    ? `<p style="margin:16px 0 0"><a href="${esc(d.adminUrl)}" style="display:inline-block;background:${BRAND};color:#001016;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:8px;font-size:14px">Ver solicitud</a></p>`
    : "";
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">
      ${row("Nombre", esc(d.name))}
      ${row("Email", esc(d.email))}
      ${d.phone ? row("Teléfono", esc(d.phone)) : ""}
      ${d.city ? row("Ciudad", esc(d.city)) : ""}
    </table>
    <p style="margin:0;padding:12px;background:#0b0f14;border:1px solid #1f2937;border-radius:8px;color:#e5e7eb;font-size:14px;white-space:pre-wrap">${esc(d.message)}</p>
    ${cta}`;
  return { subject: `Nuevo contacto · ${d.name}`, html: layout("Nuevo contacto", body) };
}
