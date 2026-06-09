// API de alto nivel para notificaciones por email. Best-effort: nunca lanza.
import { sendEmail, type EmailResult } from "./send";
import {
  bookingCustomerEmail,
  bookingAdminEmail,
  contactAdminEmail,
  type BookingEmailData,
  type ContactEmailData,
} from "./templates";
import { getSiteConfig } from "../site-config";

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
