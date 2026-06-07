// Transporte de email provider-agnóstico (sin SDK, solo fetch).
// Usa Resend o Brevo según la API key disponible. Si no hay ninguna,
// hace no-op seguro (registra y omite) para no romper en dev/test.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export type EmailResult = { sent: boolean; skipped?: boolean; error?: string };

const DEFAULT_FROM = "Alquiler Karaoke <onboarding@resend.dev>";

/** Separa "Nombre <email@dominio>" en sus partes. */
function parseFrom(raw: string): { name: string; email: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "Alquiler Karaoke", email: m[2] };
  return { name: "Alquiler Karaoke", email: raw.trim() };
}

/** Envía un email. Nunca lanza: devuelve el resultado para registrar. */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  try {
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        }),
      });
      if (!res.ok) return { sent: false, error: `Resend ${res.status}` };
      return { sent: true };
    }

    if (brevoKey) {
      const sender = parseFrom(from);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: msg.to }],
          subject: msg.subject,
          htmlContent: msg.html,
          ...(msg.replyTo ? { replyTo: { email: msg.replyTo } } : {}),
        }),
      });
      if (!res.ok) return { sent: false, error: `Brevo ${res.status}` };
      return { sent: true };
    }

    // Sin proveedor configurado: no-op (no es un error).
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] omitido (sin proveedor): "${msg.subject}" → ${msg.to}`);
    }
    return { sent: false, skipped: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "error desconocido" };
  }
}
