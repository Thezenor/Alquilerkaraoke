import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

// Contrato de servicio en PDF (A4, multipágina) con pdf-lib. Importes en céntimos.

export type ContractPdfData = {
  number: string;
  date: string;
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
  total: number;
  deposit: number;
  terms: string;
  signed?: { name: string; at: string; ip?: string | null; hash?: string | null; image?: string | null } | null;
};

const A4 = { w: 595.28, h: 841.89 };
const M = 50;
const INK = rgb(0.07, 0.09, 0.11);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.82, 0.84, 0.86);
const ACCENT = rgb(0.05, 0.55, 0.62);

function eur(cents: number): string {
  const v = Math.abs(cents);
  const s = (v / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cents < 0 ? "-" : ""}${s} EUR`;
}
const safe = (s: string | null | undefined) => (s ?? "").replace(/[^\x20-\xFF€]/g, "").trim();

function wrap(font: PDFFont, str: string, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of safe(str).split("\n")) {
    if (!para) {
      out.push("");
      continue;
    }
    let cur = "";
    for (const w of para.split(/\s+/)) {
      const next = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > maxWidth && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

export async function buildContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Contrato ${data.number}`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  const contentW = A4.w - 2 * M;

  const newPage = () => {
    page = pdf.addPage([A4.w, A4.h]);
    y = A4.h - M;
  };
  const ensure = (space: number) => {
    if (y - space < M) newPage();
  };
  const text = (s: string, x: number, yy: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(safe(s), { x, y: yy, size, font: f, color });
  const para = (s: string, size: number, f: PDFFont = font, color = INK, gap = 3) => {
    for (const ln of wrap(f, s, size, contentW)) {
      ensure(size + gap);
      if (ln) page.drawText(ln, { x: M, y, size, font: f, color });
      y -= size + gap;
    }
  };

  // ── Cabecera ──
  text(data.company.name, M, y, 16, bold);
  const titleW = bold.widthOfTextAtSize("CONTRATO DE SERVICIO", 13);
  page.drawText("CONTRATO DE SERVICIO", { x: A4.w - M - titleW, y, size: 13, font: bold, color: ACCENT });
  y -= 16;
  const sub = `Nº ${data.number} · ${data.date}`;
  const subW = font.widthOfTextAtSize(sub, 10);
  page.drawText(sub, { x: A4.w - M - subW, y, size: 10, font, color: MUTED });
  y -= 24;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: LINE });
  y -= 20;

  // ── Partes ──
  text("PRESTADOR", M, y, 9, bold, MUTED);
  text("CLIENTE", A4.w / 2 + 10, y, 9, bold, MUTED);
  y -= 14;
  const prov = [
    data.company.legalName || data.company.name,
    data.company.taxId ? `CIF/NIF: ${data.company.taxId}` : null,
    data.company.address,
    [data.company.email, data.company.phone].filter(Boolean).join(" · ") || null,
  ].filter(Boolean) as string[];
  const cust = [data.customer.name, data.customer.email, data.customer.phone].filter(Boolean) as string[];
  const rows = Math.max(prov.length, cust.length);
  for (let i = 0; i < rows; i++) {
    ensure(13);
    if (prov[i]) text(prov[i], M, y, 9);
    if (cust[i]) text(cust[i], A4.w / 2 + 10, y, 9);
    y -= 13;
  }
  y -= 12;

  // ── Resumen del servicio ──
  text("SERVICIO CONTRATADO", M, y, 9, bold, MUTED);
  y -= 14;
  const summary = [
    `Servicio: ${data.event.packName}`,
    data.event.eventDate ? `Fecha del evento: ${data.event.eventDate}` : null,
    data.event.province ? `Provincia: ${data.event.province}` : null,
    `Duración: ${data.event.hours} h${data.event.night ? " · nocturno" : ""}`,
    `Importe total: ${eur(data.total)} · Reserva: ${eur(data.deposit)}`,
  ].filter(Boolean) as string[];
  for (const l of summary) {
    ensure(13);
    text(l, M, y, 10);
    y -= 13;
  }
  y -= 14;

  // ── Condiciones ──
  ensure(20);
  text("CONDICIONES", M, y, 11, bold);
  y -= 18;
  para(data.terms, 9.5, font, INK, 4);
  y -= 16;

  // ── Firma ──
  ensure(110);
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.6, color: LINE });
  y -= 18;
  text("FIRMA DEL CLIENTE", M, y, 9, bold, MUTED);
  y -= 16;

  if (data.signed) {
    if (data.signed.image) {
      try {
        const b64 = data.signed.image.replace(/^data:image\/png;base64,/, "");
        const png = await pdf.embedPng(b64);
        const dims = png.scaleToFit(180, 60);
        page.drawImage(png, { x: M, y: y - dims.height + 8, width: dims.width, height: dims.height });
        y -= dims.height + 6;
      } catch {
        // firma dibujada no embebible: se omite, la aceptación electrónica es válida igualmente
      }
    }
    text(`Firmado electrónicamente por: ${data.signed.name}`, M, y, 10, bold);
    y -= 14;
    text(`Fecha y hora: ${data.signed.at}`, M, y, 9, font, MUTED);
    y -= 12;
    if (data.signed.ip) {
      text(`IP: ${data.signed.ip}`, M, y, 9, font, MUTED);
      y -= 12;
    }
    if (data.signed.hash) {
      text(`Huella de integridad (SHA-256): ${data.signed.hash}`, M, y, 7.5, font, MUTED);
      y -= 12;
    }
  } else {
    text("Pendiente de firma electrónica por el cliente.", M, y, 10, font, MUTED);
    y -= 14;
  }

  return pdf.save();
}
