// Verificación de Cloudflare Turnstile (anti-spam). Si no hay clave secreta
// configurada, es un no-op (devuelve true) y se mantienen honeypot + rate-limit.
// En errores de red no bloquea (fail-open): es anti-spam, no autenticación.

export async function verifyTurnstile(token: string | null | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // no configurado → no-op
  if (!token) return false; // configurado pero sin token → rechazar

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip && ip !== "unknown" ? { remoteip: ip } : {}),
      }),
    });
    if (!res.ok) return true; // fallo del servicio → no bloquear
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return true; // error de red → no bloquear (siguen honeypot + rate-limit)
  }
}
