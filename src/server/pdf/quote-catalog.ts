import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { glowPng } from "./assets";
import { LOGO_LIGHT_PNG_BASE64, LOGO_LIGHT_RATIO } from "./logo-light";

// Genera un presupuesto/catálogo en PDF (A4) con el diseño premium oscuro de la marca,
// usando pdf-lib (JS puro, sin navegador). Importes en céntimos. Devuelve los bytes del PDF.
// Estructura: portada · servicios · una página por opción/producto · condiciones · contraportada.

export type QuoteCatalogLine = {
  name: string;
  description?: string | null; // "qué incluye": cada línea/viñeta separada por salto de línea
  hours?: number | null;
  lineTotal: number; // céntimos, sin IVA
};

export type QuoteCatalogData = {
  number: string;
  date: string; // dd/mm/yyyy
  company: {
    name: string;
    legalName?: string | null;
    taxId?: string | null;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    web?: string | null;
    iban?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  };
  customer: { name: string; email?: string | null; phone?: string | null };
  event: { eventDate?: string | null; province?: string | null; eventTime?: string | null };
  lines: QuoteCatalogLine[];
  amounts: { subtotal: number; vat: number; total: number; deposit: number; vatPercent: number };
  depositPercent: number;
  terms?: string | null;
  termsHeading?: string | null;
};

const A4 = { w: 595.28, h: 841.89 };
const MX = 52; // margen horizontal
const MT = 58; // margen superior

// Paleta (del HTML)
const BG = rgb(0.031, 0.043, 0.067); // #080B11
const INK = rgb(0.957, 0.973, 0.984); // #F4F8FB
const MUTED = rgb(0.576, 0.631, 0.69); // #93A1B0
const SOFT = rgb(0.84, 0.87, 0.9);
const CY = rgb(0.133, 0.827, 0.933); // #22D3EE
const CY_LT = rgb(0.561, 0.957, 0.984); // #8FF4FB
const VIO = rgb(0.655, 0.545, 0.98); // #A78BFA
const WHITE = rgb(1, 1, 1);

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

/** Parte un texto en líneas que caben en maxWidth. */
function wrap(font: PDFFont, str: string, size: number, maxWidth: number): string[] {
  const words = safe(str).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildQuoteCatalogPdf(data: QuoteCatalogData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Presupuesto ${data.number}`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const lines = data.lines.length ? data.lines : [{ name: "Servicio", description: null, hours: null, lineTotal: data.amounts.subtotal }];
  // Numeración de pie: servicios (2) … condiciones. Total visible = servicios+opciones+condiciones+contraportada+portada.
  const totalPages = 1 + 1 + lines.length + 1 + 1;

  // ── Utilidades de página ──
  const newPage = (): PDFPage => {
    const p = pdf.addPage([A4.w, A4.h]);
    p.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: BG });
    return p;
  };
  // Imágenes embebidas: logo real de marca + glows con degradado radial suave.
  const cyGlow = await pdf.embedPng(await glowPng("#22D3EE"));
  const viGlow = await pdf.embedPng(await glowPng("#7C3AED"));
  const logo = await pdf.embedPng(Buffer.from(LOGO_LIGHT_PNG_BASE64, "base64"));

  // Glow centrado en (cx,cy) con diámetro `size` (imagen radial → degradado suave).
  const glow = (p: PDFPage, cx: number, cy: number, size: number, img: PDFImage, opacity = 0.55) =>
    p.drawImage(img, { x: cx - size / 2, y: cy - size / 2, width: size, height: size, opacity });
  // Logo de marca con altura `h`; devuelve su anchura para colocar elementos al lado.
  const drawLogo = (p: PDFPage, x: number, y: number, h: number) => {
    const w = h * LOGO_LIGHT_RATIO;
    p.drawImage(logo, { x, y, width: w, height: h });
    return w;
  };
  const text = (p: PDFPage, s: string, x: number, y: number, size: number, f: PDFFont = font, color = INK, opacity = 1) =>
    p.drawText(safe(s), { x, y, size, font: f, color, opacity });
  const right = (p: PDFPage, s: string, xRight: number, y: number, size: number, f: PDFFont = font, color = INK) => {
    const str = safe(s);
    p.drawText(str, { x: xRight - f.widthOfTextAtSize(str, size), y, size, font: f, color });
  };
  const card = (p: PDFPage, x: number, y: number, w: number, h: number, border = CY, borderOp = 0.28) => {
    p.drawRectangle({ x, y, width: w, height: h, color: WHITE, opacity: 0.045 });
    p.drawRectangle({ x, y, width: w, height: h, borderColor: border, borderWidth: 1, opacity: 0, borderOpacity: borderOp });
  };
  const footer = (p: PDFPage, n: number) => {
    text(p, data.company.web || "www.alquilerkaraoke.com", MX, 26, 7.5, font, MUTED, 0.5);
    right(p, `${String(n).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, A4.w - MX, 26, 7.5, font, MUTED);
  };

  // ════════ PÁGINA 1 · PORTADA ════════
  {
    const p = newPage();
    glow(p, 60, A4.h - 30, 560, cyGlow, 0.6);
    glow(p, A4.w - 30, 120, 560, viGlow, 0.42);
    // Cabecera: logo real + fecha
    drawLogo(p, MX, A4.h - MT - 30, 34);
    right(p, "FECHA DE PROPUESTA", A4.w - MX, A4.h - MT - 8, 8.5, bold, MUTED);
    right(p, data.date, A4.w - MX, A4.h - MT - 24, 11, bold, INK);

    // Bloque central
    let y = 360;
    text(p, "KARAOKE Y EVENTOS PREMIUM", MX, y, 10.5, bold, CY);
    y -= 56;
    text(p, "Presupuesto", MX, y, 46, bold, INK);
    y -= 30;
    text(p, "de tu evento", MX, y, 46, bold, INK);
    y -= 40;
    for (const ln of wrap(font, "Alquiler de karaoke y eventos para una experiencia profesional.", 15, 360)) {
      text(p, ln, MX, y, 15, font, SOFT);
      y -= 21;
    }

    // Pie de contacto
    const fy = 110;
    p.drawLine({ start: { x: MX, y: fy + 16 }, end: { x: A4.w - MX, y: fy + 16 }, thickness: 0.8, color: WHITE, opacity: 0.12 });
    text(p, "CLIENTE", MX, fy, 8.5, bold, MUTED);
    text(p, safe(data.customer.name) || "—", MX, fy - 16, 13, bold, INK);
    const contact = [data.customer.email, data.customer.phone].filter(Boolean).map(String).join("  ·  ");
    if (contact) text(p, contact, MX, fy - 32, 10, font, SOFT);

    const comp = [
      data.company.phone ? `Tel. ${data.company.phone}` : null,
      data.company.email,
      data.company.web || "www.alquilerkaraoke.com",
    ].filter(Boolean) as string[];
    let cyl = fy;
    for (const l of comp) {
      right(p, l, A4.w - MX, cyl, 10, font, SOFT);
      cyl -= 15;
    }
  }

  // ════════ PÁGINA 2 · SERVICIOS (marca) ════════
  {
    const p = newPage();
    glow(p, A4.w - 20, A4.h - 20, 440, cyGlow, 0.42);
    glow(p, 10, 140, 460, viGlow, 0.34);
    let y = A4.h - MT;
    text(p, "QUE HACEMOS", MX, y, 10.5, bold, CY);
    y -= 28;
    text(p, "No alquilamos una maquina:", MX, y, 22, bold, INK);
    y -= 26;
    text(p, "montamos una experiencia", MX, y, 22, bold, CY);
    y -= 26;
    for (const ln of wrap(font, "Mas de 30 anos montando eventos por toda Espana, con equipos profesionales, montaje incluido y personal cualificado de principio a fin.", 11.5, A4.w - 2 * MX)) {
      text(p, ln, MX, y, 11.5, font, SOFT);
      y -= 16;
    }
    y -= 10;

    const services: [string, string][] = [
      ["Alquiler de karaoke", "Equipo profesional, pantallas y miles de canciones, con o sin tecnico."],
      ["DJ y discomovil", "Musica y ambiente de baile para que la fiesta no pare."],
      ["Sonido e iluminacion", "Equipos profesionales adaptados a cada espacio y aforo."],
      ["Fotomaton y 360", "Recuerdos divertidos al instante para tus invitados."],
      ["Evento Furor", "El concurso musical con animador, micros y produccion completa."],
      ["Espuma y Holi", "Espuma o color, musica y animacion llenos de energia."],
      ["Gaming y consolas", "Torneos y zonas de juego con consolas, pantallas y mandos."],
      ["OkeBox", "Karaoke autonomo para tenerlo todo el dia en tu evento."],
    ];
    const colW = (A4.w - 2 * MX - 12) / 2;
    const rowH = 50;
    for (let i = 0; i < services.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MX + col * (colW + 12);
      const cy = y - row * (rowH + 8);
      card(p, x, cy - rowH, colW, rowH);
      p.drawRectangle({ x: x + 12, y: cy - 26, width: 8, height: 8, color: CY });
      text(p, services[i][0], x + 30, cy - 18, 11.5, bold, INK);
      for (let k = 0; k < wrap(font, services[i][1], 9, colW - 40).length && k < 2; k++) {
        text(p, wrap(font, services[i][1], 9, colW - 40)[k], x + 30, cy - 32 - k * 11, 9, font, MUTED);
      }
    }
    y -= 4 * (rowH + 8) + 14;

    text(p, "HACEMOS EVENTOS PARA", MX, y, 10.5, bold, MUTED);
    y -= 18;
    const chips = ["Particulares", "Empresas", "Bodas", "Cumpleanos", "Despedidas", "Comuniones", "Graduaciones", "Fiestas populares"];
    let cx = MX;
    for (const c of chips) {
      const w = font.widthOfTextAtSize(c, 10) + 22;
      if (cx + w > A4.w - MX) {
        cx = MX;
        y -= 26;
      }
      p.drawRectangle({ x: cx, y: y - 6, width: w, height: 20, color: CY, opacity: 0.08, borderColor: CY, borderWidth: 1, borderOpacity: 0.35 });
      text(p, c, cx + 11, y, 10, font, CY_LT);
      cx += w + 8;
    }
    y -= 36;

    const stats: [string, string][] = [
      ["+30", "anos de experiencia"],
      ["180k+", "canciones, 14 idiomas"],
      ["RC", "Seguro de Resp. Civil"],
      ["APEK", "SGAE - AGEDI - personal"],
    ];
    const sw = (A4.w - 2 * MX - 3 * 10) / 4;
    for (let i = 0; i < stats.length; i++) {
      const x = MX + i * (sw + 10);
      card(p, x, y - 54, sw, 54);
      const num = stats[i][0];
      text(p, num, x + (sw - bold.widthOfTextAtSize(num, 17)) / 2, y - 26, 17, bold, CY);
      for (let k = 0; k < wrap(font, stats[i][1], 8, sw - 12).length && k < 2; k++) {
        const l = wrap(font, stats[i][1], 8, sw - 12)[k];
        text(p, l, x + (sw - font.widthOfTextAtSize(l, 8)) / 2, y - 40 - k * 10, 8, font, SOFT);
      }
    }
    footer(p, 2);
  }

  // ════════ PÁGINAS DE OPCIONES (una por línea) ════════
  lines.forEach((line, idx) => {
    const premium = /furor|premium/i.test(line.name);
    const accent = premium ? VIO : CY;
    const p = newPage();
    glow(p, premium ? 30 : A4.w - 30, A4.h - 30, 520, premium ? viGlow : cyGlow, 0.45);
    glow(p, premium ? A4.w - 20 : 20, 120, 420, premium ? cyGlow : viGlow, 0.3);
    let y = A4.h - MT;

    // Etiqueta + fecha del evento
    const tag = `${premium ? "PREMIUM" : "PRESUPUESTO"}${data.event.province ? " - " + data.event.province.toUpperCase() : ""}`;
    const tw = bold.widthOfTextAtSize(tag, 9) + 24;
    p.drawRectangle({ x: MX, y: y - 6, width: tw, height: 22, color: accent, opacity: 0.1, borderColor: accent, borderWidth: 1, borderOpacity: 0.4 });
    text(p, tag, MX + 12, y, 9, bold, accent);
    right(p, "FECHA DEL EVENTO", A4.w - MX, y + 2, 8.5, bold, MUTED);
    right(p, data.event.eventDate || "—", A4.w - MX, y - 12, 11, bold, INK);
    y -= 48;

    text(p, safe(line.name) || `Opcion ${idx + 1}`, MX, y, 28, bold, INK);
    y -= 28;
    if (line.hours) {
      text(p, `Hasta ${line.hours} h de evento (ampliables) - montaje y desmontaje incluidos.`, MX, y, 11, font, SOFT);
      y -= 22;
    } else {
      y -= 4;
    }

    // Tarjeta "Qué incluye"
    const items = (line.description || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((s) => s.replace(/^\s*[-*•·]\s*/, "").trim())
      .filter(Boolean);
    if (items.length) {
      const innerW = A4.w - 2 * MX - 40;
      // Mide alto necesario
      let rowsCount = 0;
      const wrapped = items.map((it) => {
        const w = wrap(font, it, 11, innerW);
        rowsCount += w.length;
        return w;
      });
      const cardH = 48 + rowsCount * 15 + (items.length - 1) * 4;
      card(p, MX, y - cardH, A4.w - 2 * MX, cardH, accent, 0.3);
      let iy = y - 24;
      text(p, "QUE INCLUYE", MX + 20, iy, 11, bold, accent);
      p.drawLine({ start: { x: MX + 20, y: iy - 9 }, end: { x: A4.w - MX - 20, y: iy - 9 }, thickness: 0.8, color: accent, opacity: 0.35 });
      iy -= 24;
      for (const w of wrapped) {
        p.drawRectangle({ x: MX + 20, y: iy + 1, width: 6, height: 6, color: accent });
        w.forEach((l, k) => {
          text(p, l, MX + 36, iy - k * 15, 11, font, SOFT);
        });
        iy -= w.length * 15 + 4;
      }
      y -= cardH + 18;
    }

    // Tarjeta de precio
    const priceH = 64;
    p.drawRectangle({ x: MX, y: y - priceH, width: A4.w - 2 * MX, height: priceH, color: accent, opacity: 0.14, borderColor: accent, borderWidth: 1, borderOpacity: 0.45 });
    text(p, `Precio ${safe(line.name)}`.slice(0, 60), MX + 22, y - 28, 12, bold, INK);
    text(p, "IVA no incluido", MX + 22, y - 44, 9, font, MUTED);
    const amount = eur(line.lineTotal);
    right(p, amount, A4.w - MX - 60, y - 36, 30, bold, INK);
    text(p, "+ IVA", A4.w - MX - 50, y - 36, 12, bold, MUTED);
    y -= priceH + 14;
    text(p, "* A todos los precios hay que anadir el IVA correspondiente.", MX, y, 9, font, MUTED);
    y -= 28;

    // Nota de reserva
    const noteH = 46;
    p.drawRectangle({ x: MX, y: y - noteH, width: A4.w - 2 * MX, height: noteH, color: accent, opacity: 0.08, borderColor: accent, borderWidth: 1, borderOpacity: 0.3 });
    const note = `Reserva de tu fecha. Este presupuesto mantiene la fecha bloqueada durante 3 dias desde su envio. Para confirmar la reserva en firme es necesario abonar el ${data.depositPercent}% del importe.`;
    let ny = y - 18;
    for (const l of wrap(font, note, 10, A4.w - 2 * MX - 40)) {
      text(p, l, MX + 20, ny, 10, font, SOFT);
      ny -= 13;
    }
    footer(p, 2 + idx + 1);
  });

  // ════════ CONDICIONES ════════
  {
    const terms = safe(data.terms);
    let p = newPage();
    glow(p, A4.w - 20, A4.h - 20, 420, cyGlow, 0.3);
    let y = A4.h - MT;
    text(p, "CONTRATO", MX, y, 10.5, bold, CY);
    y -= 24;
    text(p, safe(data.termsHeading) || "Condiciones del servicio", MX, y, 22, bold, INK);
    y -= 28;

    const SIZE = 8.6;
    const LEAD = 11.4;
    const ensure = (need = LEAD) => {
      if (y < 70 + need) {
        footer(p, totalPages - 1);
        p = newPage();
        y = A4.h - MT;
      }
    };
    if (terms) {
      for (const para of data.terms!.replace(/\r\n/g, "\n").split("\n")) {
        const raw = safe(para).trim();
        if (!raw) {
          y -= LEAD * 0.55;
          continue;
        }
        const heading = /^(MUY IMPORTANTE|IMPORTANT|ATENCI)/.test(raw);
        const f = heading ? bold : font;
        const color = heading ? CY_LT : SOFT;
        for (const l of wrap(f, raw, SIZE, A4.w - 2 * MX)) {
          ensure();
          text(p, l, MX, y, SIZE, f, color);
          y -= LEAD;
        }
        y -= 2;
      }
    }

    // Bloque de pago + firma
    ensure(96);
    y -= 8;
    const half = (A4.w - 2 * MX - 14) / 2;
    const blockH = 78;
    card(p, MX, y - blockH, half, blockH, CY, 0.25);
    text(p, "RESERVA DEL EVENTO", MX + 16, y - 20, 9.5, bold, CY);
    for (let k = 0; k < wrap(font, `Pago del ${data.depositPercent}% para reservar la fecha.`, 9.5, half - 32).length; k++) {
      text(p, wrap(font, `Pago del ${data.depositPercent}% para reservar la fecha.`, 9.5, half - 32)[k], MX + 16, y - 36 - k * 12, 9.5, font, SOFT);
    }
    if (data.company.iban) {
      text(p, "IBAN:", MX + 16, y - 60, 9, font, MUTED);
      text(p, data.company.iban, MX + 16, y - 72, 10.5, bold, INK);
    }
    const sx = MX + half + 14;
    card(p, sx, y - blockH, half, blockH, WHITE, 0.12);
    text(p, "FECHA Y FIRMA - ACEPTACION DEL CLIENTE", sx + 14, y - 20, 8.5, bold, MUTED);
    p.drawLine({ start: { x: sx + 14, y: y - 56 }, end: { x: sx + half - 14, y: y - 56 }, thickness: 0.8, color: WHITE, opacity: 0.25 });
    text(p, "Firma del cliente", sx + 14, y - 70, 8.5, font, MUTED);
    y -= blockH + 14;

    const legal = [data.company.legalName || data.company.name, data.company.email, data.company.phone, data.company.web || "www.alquilerkaraoke.com"].filter(Boolean).map(String).join("  -  ");
    text(p, legal, MX + (A4.w - 2 * MX - font.widthOfTextAtSize(safe(legal), 8)) / 2, Math.max(y, 60), 8, font, MUTED);
    footer(p, totalPages - 1);
  }

  // ════════ CONTRAPORTADA ════════
  {
    const p = newPage();
    glow(p, A4.w / 2, A4.h - 20, 620, cyGlow, 0.5);
    glow(p, A4.w - 30, 90, 540, viGlow, 0.4);
    let y = A4.h - 150;
    const backLogoH = 52;
    drawLogo(p, (A4.w - backLogoH * LOGO_LIGHT_RATIO) / 2, y, backLogoH);

    y -= 60;
    const claim1 = "Tu pones la voz.";
    text(p, claim1, (A4.w - bold.widthOfTextAtSize(claim1, 30)) / 2, y, 30, bold, INK);
    y -= 34;
    const claim2 = "Nosotros, el espectaculo.";
    text(p, claim2, (A4.w - bold.widthOfTextAtSize(claim2, 30)) / 2, y, 30, bold, CY);
    y -= 40;
    for (const l of wrap(font, "Mas de 30 anos convirtiendo cada celebracion en una experiencia inolvidable, en toda Espana.", 12.5, 380)) {
      text(p, l, (A4.w - font.widthOfTextAtSize(l, 12.5)) / 2, y, 12.5, font, SOFT);
      y -= 18;
    }

    y -= 26;
    const rows = [
      data.company.address,
      [data.company.phone ? `Tel. ${data.company.phone}` : null, data.company.whatsapp ? `WhatsApp ${data.company.whatsapp}` : null].filter(Boolean).join("   -   ") || null,
      [data.company.email].filter(Boolean).join("  ") || null,
      data.company.web || "www.alquilerkaraoke.com",
    ].filter(Boolean) as string[];
    for (const r of rows) {
      text(p, r, (A4.w - font.widthOfTextAtSize(safe(r), 12)) / 2, y, 12, font, r === rows[rows.length - 1] ? CY_LT : SOFT);
      y -= 20;
    }

    const socials = [data.company.instagram, data.company.facebook, data.company.tiktok, data.company.youtube].filter(Boolean) as string[];
    if (socials.length) {
      y -= 12;
      const label = socials.map((s) => s.replace(/^https?:\/\/(www\.)?/, "")).join("   ·   ");
      for (const l of wrap(font, label, 9, A4.w - 2 * MX)) {
        text(p, l, (A4.w - font.widthOfTextAtSize(l, 9)) / 2, y, 9, font, MUTED);
        y -= 12;
      }
    }

    const foot = `${data.company.legalName || data.company.name}  -  ${data.company.web || "www.alquilerkaraoke.com"}`;
    text(p, foot, (A4.w - font.widthOfTextAtSize(safe(foot), 9)) / 2, 50, 9, font, MUTED);
  }

  return pdf.save();
}
