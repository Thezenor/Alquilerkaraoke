import type { Booking, SiteConfig } from "@/generated/prisma/client";
import { defaultQuoteTerms, quoteTermsHeading } from "@/lib/legal-terms";
import type { QuoteCatalogData, QuoteCatalogLine } from "./quote-catalog";

type ExtraSnap = { name: string; price: number };
type ActivitySnap = { packName?: string; name?: string; description?: string | null; hours?: number | null; lineTotal: number };

function siteWeb(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://www.alquilerkaraoke.com";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Construye los datos del PDF premium a partir de una reserva/presupuesto y la config. */
export function quoteCatalogDataFromBooking(b: Booking, config: SiteConfig | null): QuoteCatalogData {
  const number = `PRE-${b.createdAt.getFullYear()}-${b.id.slice(-6).toUpperCase()}`;
  const activities = (b.activities ?? []) as ActivitySnap[];
  const extras = (b.extras ?? []) as ExtraSnap[];

  let lines: QuoteCatalogLine[];
  if (activities.length) {
    lines = activities.map((a) => ({
      name: a.name ?? a.packName ?? b.packName,
      description: a.description ?? null,
      hours: a.hours ?? null,
      lineTotal: a.lineTotal,
    }));
  } else {
    // Reserva del flujo público: una sola línea desde el pack + extras.
    const desc = extras.map((e) => e.name).join("\n");
    lines = [{ name: b.packName, description: desc || null, hours: b.hours, lineTotal: b.subtotal }];
  }

  const taxableBase = b.total - b.vat;
  const vatPercent = taxableBase > 0 ? Math.round((b.vat * 100) / taxableBase) : 21;
  const depositPercent = b.total > 0 ? Math.round((b.deposit * 100) / b.total) : 50;

  return {
    number,
    date: b.createdAt.toLocaleDateString("es-ES"),
    company: {
      name: config?.companyName ?? "Alquiler Karaoke",
      legalName: config?.legalName,
      taxId: config?.taxId,
      address: config?.address,
      email: config?.email,
      phone: config?.phone ?? "607724965",
      whatsapp: config?.whatsapp,
      web: siteWeb(),
      iban: config?.iban,
      instagram: config?.instagram,
      facebook: config?.facebook,
      tiktok: config?.tiktok,
      youtube: config?.youtube,
    },
    customer: { name: b.name, email: b.email, phone: b.phone },
    event: {
      eventDate: b.eventDate ? b.eventDate.toLocaleDateString("es-ES") : null,
      province: b.province,
      eventTime: b.eventTime,
    },
    lines,
    amounts: { subtotal: b.subtotal, vat: b.vat, total: b.total, deposit: b.deposit, vatPercent },
    depositPercent,
    terms: config?.quoteTerms || defaultQuoteTerms(b.locale),
    termsHeading: quoteTermsHeading(b.locale),
  };
}
