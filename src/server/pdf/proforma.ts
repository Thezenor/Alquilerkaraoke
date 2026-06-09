import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { LOGO_DARK_PNG_BASE64, LOGO_DARK_RATIO } from "./logo";

// Genera una proforma/presupuesto en PDF (A4) con pdf-lib (JS puro, sin navegador).
// Importes en céntimos. Devuelve los bytes del PDF.

export type ProformaData = {
  number: string;
  date: string; // dd/mm/yyyy
  company: {
    name: string;
    legalName?: string | null;
    taxId?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  customer: { name: string; email?: string | null; phone?: string | null };
  event: { packName: string; eventDate?: string | null; province?: string | null; hours: number; night: boolean };
  extras: { name: string; price: number }[];
  amounts: {
    subtotal: number;
    discount: number;
    vat: number;
    total: number;
    deposit: number;
    securityDeposit: number;
    amountPaid: number;
  };
  payment?: { iban?: string | null; bizum?: string | null; info?: string | null };
  paymentStatusLabel: string;
  /** Condiciones del presupuesto (se imprimen en una página aparte). */
  terms?: string | null;
  /** Encabezado de la sección de condiciones (según idioma del cliente). */
  termsHeading?: string | null;
  // Si hay varias actividades, se listan como líneas independientes.
  activities?: { packName: string; hours: number; lineTotal: number }[];
};

const A4 = { w: 595.28, h: 841.89 };
const M = 50; // margen
const INK = rgb(0.07, 0.09, 0.11);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.82, 0.84, 0.86);
const ACCENT = rgb(0.05, 0.55, 0.62);

/** Importe en formato es-ES sin depender de Intl (evita espacios no codificables). */
function eur(cents: number): string {
  const neg = cents < 0;
  const v = Math.abs(cents);
  const s = (v / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${s} EUR`;
}

/** Mantiene solo caracteres codificables por WinAnsi (Latin-1 + €). */
function safe(s: string | null | undefined): string {
  return (s ?? "").replace(/[^\x20-\xFF€]/g, "").trim();
}

export async function buildProformaPdf(data: ProformaData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Proforma ${data.number}`);
  const page = pdf.addPage([A4.w, A4.h]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const text = (s: string, x: number, y: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(s), { x, y, size, font: f, color });

  const right = (s: string, xRight: number, y: number, size: number, f: PDFFont = font, color = INK) => {
    const str = safe(s);
    const w = f.widthOfTextAtSize(str, size);
    page.drawText(str, { x: xRight - w, y, size, font: f, color });
  };

  const hr = (y: number) =>
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: LINE });

  let y = A4.h - M;

  // ── Cabecera: logo (izq) + documento (der) ──
  const logo = await pdf.embedPng(LOGO_DARK_PNG_BASE64);
  const logoH = 34;
  const logoW = logoH * LOGO_DARK_RATIO;
  page.drawImage(logo, { x: M, y: y - logoH, width: logoW, height: logoH });
  right("PRESUPUESTO", A4.w - M, y - 4, 16, bold, ACCENT);
  y -= 22;
  right(`Nº ${data.number}`, A4.w - M, y, 10, font, MUTED);
  y -= 13;
  right(`Fecha: ${data.date}`, A4.w - M, y, 10, font, MUTED);

  // Datos fiscales empresa (bajo el logo)
  let cy = A4.h - M - logoH - 12;
  const companyLines = [
    data.company.legalName,
    data.company.taxId ? `CIF/NIF: ${data.company.taxId}` : null,
    data.company.address,
    [data.company.email, data.company.phone].filter(Boolean).join(" · ") || null,
  ].filter(Boolean) as string[];
  for (const l of companyLines) {
    text(l, M, cy, 9, font, MUTED);
    cy -= 12;
  }

  y = Math.min(cy, y) - 18;
  hr(y);
  y -= 24;

  // ── Cliente y evento (dos columnas) ──
  const colR = A4.w / 2 + 10;
  text("CLIENTE", M, y, 9, bold, MUTED);
  text("EVENTO", colR, y, 9, bold, MUTED);
  y -= 15;

  const custLines = [data.customer.name, data.customer.email, data.customer.phone].filter(Boolean) as string[];
  const evLines = [
    data.event.packName,
    data.event.eventDate ? `Fecha: ${data.event.eventDate}` : null,
    data.event.province ? `Provincia: ${data.event.province}` : null,
    `Duración: ${data.event.hours} h${data.event.night ? " · nocturno" : ""}`,
  ].filter(Boolean) as string[];

  const rows = Math.max(custLines.length, evLines.length);
  let by = y;
  for (let i = 0; i < rows; i++) {
    if (custLines[i]) text(custLines[i], M, by, 10);
    if (evLines[i]) text(evLines[i], colR, by, 10);
    by -= 14;
  }
  y = by - 16;

  // ── Tabla de conceptos ──
  const amountX = A4.w - M;
  const tableW = A4.w - 2 * M;
  const conceptX = M + 12;
  const conceptMaxW = tableW - 12 - 110; // deja ~110 pt para la columna de importe

  // Cabecera de la tabla: barra clara + subrayado de acento.
  page.drawRectangle({ x: M, y: y - 7, width: tableW, height: 21, color: rgb(0.95, 0.96, 0.98) });
  text("CONCEPTO", conceptX, y, 9, bold, MUTED);
  right("IMPORTE", amountX - 12, y, 9, bold, MUTED);
  page.drawLine({ start: { x: M, y: y - 8 }, end: { x: amountX, y: y - 8 }, thickness: 1.2, color: ACCENT });
  let rowTop = y - 8; // borde superior de la primera fila

  let items: { concept: string; amount: number }[];
  if (data.activities && data.activities.length > 1) {
    // Varias actividades: una línea por actividad + el resto (provincia/suplementos).
    const sumLines = data.activities.reduce((s, a) => s + a.lineTotal, 0);
    items = data.activities.map((a) => ({ concept: `${a.packName} (${a.hours} h)`, amount: a.lineTotal }));
    const remainder = data.amounts.subtotal - sumLines;
    if (remainder > 0) items.push({ concept: "Provincia y suplementos", amount: remainder });
  } else {
    const extrasTotal = data.extras.reduce((s, e) => s + e.price, 0);
    const serviceAmount = data.amounts.subtotal - extrasTotal;
    items = [
      {
        concept: `${data.event.packName} — servicio (${data.event.hours} h${data.event.night ? ", nocturno" : ""})`,
        amount: serviceAmount,
      },
      ...data.extras.map((e) => ({ concept: `Extra: ${e.name}`, amount: e.price })),
    ];
  }

  // Filas: alto generoso, fondo cebra y separador BAJO el texto (nunca lo cruza).
  items.forEach((it, idx) => {
    const lines = wrapText(font, it.concept, 10.5, conceptMaxW).slice(0, 2);
    const rowH = lines.length > 1 ? 32 : 22;
    if (idx % 2 === 1) {
      page.drawRectangle({ x: M, y: rowTop - rowH, width: tableW, height: rowH, color: rgb(0.972, 0.978, 0.985) });
    }
    const baseline = rowTop - 15;
    lines.forEach((ln, k) => text(ln, conceptX, baseline - k * 13, 10.5, font, INK));
    right(eur(it.amount), amountX - 12, baseline, 10.5, font, INK);
    page.drawLine({ start: { x: M, y: rowTop - rowH }, end: { x: amountX, y: rowTop - rowH }, thickness: 0.5, color: LINE });
    rowTop -= rowH;
  });

  y = rowTop - 24;

  // ── Totales (bloque derecho) ──
  const totalsLeft = A4.w / 2 + 6;
  const tLabelX = totalsLeft + 14;
  const totalRow = (label: string, value: string, opts?: { strong?: boolean; highlight?: boolean }) => {
    const strong = opts?.strong || opts?.highlight;
    if (opts?.highlight) {
      page.drawRectangle({ x: totalsLeft, y: y - 7, width: amountX - totalsLeft, height: 22, color: ACCENT });
    }
    const f = strong ? bold : font;
    const color = opts?.highlight ? rgb(1, 1, 1) : strong ? INK : MUTED;
    const size = opts?.highlight ? 12 : 10;
    text(label, tLabelX, y, size, f, color);
    right(value, amountX - 12, y, size, f, color);
    y -= opts?.highlight ? 26 : 15;
  };
  totalRow("Subtotal (sin IVA)", eur(data.amounts.subtotal));
  if (data.amounts.discount > 0) totalRow("Descuento", `-${eur(data.amounts.discount)}`);
  totalRow("IVA", eur(data.amounts.vat));
  page.drawLine({ start: { x: totalsLeft, y: y + 6 }, end: { x: amountX, y: y + 6 }, thickness: 0.6, color: LINE });
  y -= 6;
  totalRow("TOTAL", eur(data.amounts.total), { highlight: true });
  totalRow("Reserva para confirmar", eur(data.amounts.deposit), { strong: true });
  if (data.amounts.securityDeposit > 0) totalRow("Fianza (reembolsable)", eur(data.amounts.securityDeposit));
  if (data.amounts.amountPaid !== 0) totalRow("Cobrado", eur(data.amounts.amountPaid));
  totalRow("Estado de pago", data.paymentStatusLabel);

  // ── Pie: instrucciones de pago + nota legal ──
  let fy = 150;
  const p = data.payment;
  if (p && (p.iban || p.bizum || p.info)) {
    hr(fy + 14);
    text("CÓMO PAGAR", M, fy, 9, bold, MUTED);
    fy -= 14;
    if (p.iban) {
      text(`Transferencia (IBAN): ${p.iban}`, M, fy, 9);
      fy -= 12;
    }
    if (p.bizum) {
      text(`Bizum: ${p.bizum}`, M, fy, 9);
      fy -= 12;
    }
    if (p.info) {
      for (const line of wrapText(font, p.info, 9, A4.w - 2 * M)) {
        text(line, M, fy, 9, font, MUTED);
        fy -= 11;
      }
    }
  }

  text(
    "Documento sin valor de factura. Presupuesto orientativo sujeto a confirmación de disponibilidad.",
    M,
    M,
    8,
    font,
    MUTED,
  );

  // ── Condiciones (página(s) aparte, con paginación) ──
  const terms = safe(data.terms);
  if (terms) {
    const SIZE = 8.5;
    const LEAD = 11.5;
    let tp = pdf.addPage([A4.w, A4.h]);
    let ty = A4.h - M;
    tp.drawText(safe(data.termsHeading) || "CONDICIONES DE LA RESERVA", { x: M, y: ty, size: 12, font: bold, color: ACCENT });
    ty -= 22;
    const ensure = () => {
      if (ty < M + LEAD) {
        tp = pdf.addPage([A4.w, A4.h]);
        ty = A4.h - M;
      }
    };
    for (const para of data.terms!.replace(/\r\n/g, "\n").split("\n")) {
      const raw = safe(para).trim();
      if (!raw) {
        ty -= LEAD * 0.6;
        continue;
      }
      // Encabezados destacados (MUY IMPORTANTE / ATENCIÓN) en negrita.
      const heading = /^(MUY IMPORTANTE|IMPORTANT|ATENCI)/.test(raw);
      const f = heading ? bold : font;
      const color = heading ? INK : rgb(0.25, 0.27, 0.3);
      for (const line of wrapText(f, raw, SIZE, A4.w - 2 * M)) {
        ensure();
        tp.drawText(line, { x: M, y: ty, size: SIZE, font: f, color });
        ty -= LEAD;
      }
    }
  }

  return pdf.save();
}

/** Parte un texto en líneas que caben en maxWidth. */
function wrapText(font: PDFFont, str: string, size: number, maxWidth: number): string[] {
  const words = safe(str).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}
