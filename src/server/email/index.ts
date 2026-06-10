// API de alto nivel para notificaciones por email. Best-effort: nunca lanza.
import { sendEmail, type EmailResult } from "./send";
import {
  bookingCustomerEmail,
  bookingAdminEmail,
  bookingConfirmedEmail,
  bookingDeclinedEmail,
  contactAdminEmail,
  contractSignedCustomerEmail,
  contractSignedAdminEmail,
  type BookingEmailData,
  type ContactEmailData,
  type ContractSignedEmailData,
} from "./templates";
import { getSiteConfig } from "../site-config";
import type { BudgetBreakdown } from "../../lib/budget";

export { sendEmail } from "./send";
export * from "./templates";

/** Email del administrador para avisos: env EMAIL_ADMIN → SiteConfig.email. */
async function resolveAdminEmail(): Promise<string | null> {
  const fromEnv = process.env.EMAIL_ADMIN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const cfg = await getSiteConfig();
    return cfg?.email?.trim() || null;
  } catch {
    return null;
  }
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.alquilerkaraoke.com").replace(/\/$/, "");
}

/**
 * Envía el presupuesto al cliente y avisa al admin. No bloquea la reserva:
 * registra el resultado pero nunca lanza.
 */
export async function notifyNewBooking(
  bookingId: string,
  data: BookingEmailData & { email: string },
): Promise<void> {
  try {
    const adminUrl = `${siteUrl()}/admin/reservas/${bookingId}`;

    // Datos de pago (transferencia/Bizum) para incluir en el email del cliente.
    let payment: BookingEmailData["payment"];
    try {
      const cfg = await getSiteConfig();
      if (cfg && (cfg.iban || cfg.bizum || cfg.paymentInfo)) {
        payment = { iban: cfg.iban, bizum: cfg.bizum, info: cfg.paymentInfo };
      }
    } catch {
      // sin datos de pago: el email se envía igualmente
    }

    const customer = bookingCustomerEmail({ ...data, payment });
    const toCustomer = sendEmail({ to: data.email, subject: customer.subject, html: customer.html });

    const adminEmail = await resolveAdminEmail();
    const toAdmin = adminEmail
      ? sendEmail({
          to: adminEmail,
          replyTo: data.email,
          ...bookingAdminEmail({ ...data, adminUrl }),
        })
      : Promise.resolve<EmailResult>({ sent: false, skipped: true });

    const [c, a] = await Promise.all([toCustomer, toAdmin]);
    if (c.error || a.error) {
      console.error(`[email] reserva ${bookingId}: cliente=${c.error ?? "ok"} admin=${a.error ?? "ok"}`);
    }
  } catch (err) {
    console.error("[email] notifyNewBooking falló:", err);
  }
}

/**
 * Envía el presupuesto en PDF (diseño premium) al email del cliente, adjunto.
 * Devuelve el resultado para que el admin sepa si se envió o quedó pendiente
 * (no-op seguro si no hay proveedor de email configurado).
 */
export async function sendQuoteEmail(bookingId: string): Promise<EmailResult> {
  const { prisma } = await import("@/lib/prisma");
  const { buildQuoteCatalogPdf } = await import("@/server/pdf/quote-catalog");
  const { quoteCatalogDataFromBooking } = await import("@/server/pdf/quote-data");

  const [b, cfg] = await Promise.all([
    prisma.booking.findUnique({ where: { id: bookingId } }),
    getSiteConfig(),
  ]);
  if (!b) return { sent: false, error: "Reserva no encontrada" };

  const data = quoteCatalogDataFromBooking(b, cfg);
  const bytes = await buildQuoteCatalogPdf(data);
  const contentBase64 = Buffer.from(bytes).toString("base64");

  const company = cfg?.companyName ?? "Alquiler Karaoke";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
      <p>Hola ${b.name || ""},</p>
      <p>Te adjuntamos tu presupuesto <strong>${data.number}</strong> para tu evento. Si tienes
      cualquier duda, respóndenos a este correo o llámanos al ${data.company.phone}.</p>
      <p>Un saludo,<br/>${company}</p>
    </div>`;

  return sendEmail({
    to: b.email,
    subject: `Tu presupuesto ${data.number} · ${company}`,
    html,
    attachments: [{ filename: `${data.number}.pdf`, contentBase64 }],
  });
}

/** YYYY-MM-DD en horario local (sin desfase de zona). */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Reconstruye los datos de email desde el snapshot guardado de la reserva. */
function bookingEmailDataFromRecord(b: {
  name: string;
  packName: string;
  hours: number;
  eventDate: Date | null;
  eventTime: string | null;
  attendees: number | null;
  province: string | null;
  extras: unknown;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  deposit: number;
  securityDeposit: number;
}): BookingEmailData {
  // El desglose por conceptos no se guarda; solo se usan los totales en el email.
  const breakdown: BudgetBreakdown = {
    base: b.subtotal,
    extraHours: 0,
    province: 0,
    extras: 0,
    surcharges: 0,
    subtotal: b.subtotal,
    discount: b.discount,
    taxableBase: b.subtotal - b.discount,
    vat: b.vat,
    total: b.total,
    deposit: b.deposit,
    securityDeposit: b.securityDeposit,
  };
  const extras = Array.isArray(b.extras)
    ? (b.extras as { name?: unknown; price?: unknown }[])
        .filter((e) => typeof e?.name === "string")
        .map((e) => ({ name: String(e.name), price: typeof e.price === "number" ? e.price : 0 }))
    : [];
  return {
    customerName: b.name,
    packName: b.packName,
    hours: b.hours,
    eventDate: b.eventDate ? toDateKey(b.eventDate) : null,
    eventTime: b.eventTime,
    attendees: b.attendees,
    province: b.province,
    extras,
    breakdown,
  };
}

/**
 * Avisa al cliente de un cambio de estado de su reserva (confirmada,
 * rechazada o cancelada). Best-effort: registra el resultado y nunca lanza.
 */
export async function notifyBookingStatusChange(
  bookingId: string,
  status: "CONFIRMED" | "REJECTED" | "CANCELLED",
): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const b = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!b?.email) return;

    const data = bookingEmailDataFromRecord(b);
    let content;
    if (status === "CONFIRMED") {
      // Datos de pago (transferencia/Bizum) para los próximos pasos.
      let payment: BookingEmailData["payment"];
      try {
        const cfg = await getSiteConfig();
        if (cfg && (cfg.iban || cfg.bizum || cfg.paymentInfo)) {
          payment = { iban: cfg.iban, bizum: cfg.bizum, info: cfg.paymentInfo };
        }
      } catch {
        // sin datos de pago: el email se envía igualmente
      }
      content = bookingConfirmedEmail({ ...data, payment });
    } else {
      content = bookingDeclinedEmail({ ...data, reason: status });
    }

    const res = await sendEmail({ to: b.email, ...content });
    if (res.error) console.error(`[email] reserva ${bookingId} (${status}): ${res.error}`);
  } catch (err) {
    console.error("[email] notifyBookingStatusChange falló:", err);
  }
}

/**
 * Tras la firma del contrato: envía al cliente el enlace a su copia firmada
 * y avisa al admin. Best-effort: nunca lanza.
 */
export async function notifyContractSigned(token: string): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const contract = await prisma.contract.findUnique({
      where: { token },
      include: { booking: { select: { id: true, name: true, email: true, packName: true, eventDate: true } } },
    });
    if (!contract || contract.status !== "SIGNED" || !contract.booking.email) return;

    const signedAt = contract.signedAt ?? new Date();
    const data: ContractSignedEmailData = {
      customerName: contract.signedName || contract.booking.name,
      packName: contract.booking.packName,
      number: contract.number,
      signedAt: `${toDateKey(signedAt)} ${String(signedAt.getHours()).padStart(2, "0")}:${String(signedAt.getMinutes()).padStart(2, "0")}`,
      contractUrl: `${siteUrl()}/contrato/${contract.token}`,
      eventDate: contract.booking.eventDate ? toDateKey(contract.booking.eventDate) : null,
      email: contract.booking.email,
    };

    const toCustomer = sendEmail({ to: contract.booking.email, ...contractSignedCustomerEmail(data) });

    const adminEmail = await resolveAdminEmail();
    const toAdmin = adminEmail
      ? sendEmail({
          to: adminEmail,
          replyTo: contract.booking.email,
          ...contractSignedAdminEmail({ ...data, adminUrl: `${siteUrl()}/admin/reservas/${contract.booking.id}` }),
        })
      : Promise.resolve<EmailResult>({ sent: false, skipped: true });

    const [c, a] = await Promise.all([toCustomer, toAdmin]);
    if (c.error || a.error) {
      console.error(`[email] contrato ${contract.number}: cliente=${c.error ?? "ok"} admin=${a.error ?? "ok"}`);
    }
  } catch (err) {
    console.error("[email] notifyContractSigned falló:", err);
  }
}

/** Avisa al admin de un nuevo lead de contacto. Best-effort. */
export async function notifyNewContact(contactId: string, data: ContactEmailData): Promise<void> {
  try {
    const adminEmail = await resolveAdminEmail();
    if (!adminEmail) return;
    const adminUrl = `${siteUrl()}/admin/solicitudes/${contactId}`;
    const res = await sendEmail({
      to: adminEmail,
      replyTo: data.email,
      ...contactAdminEmail({ ...data, adminUrl }),
    });
    if (res.error) console.error(`[email] contacto ${contactId}: ${res.error}`);
  } catch (err) {
    console.error("[email] notifyNewContact falló:", err);
  }
}
