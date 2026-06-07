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

    const customer = bookingCustomerEmail(data);
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
