// Consentimiento de cookies (RGPD/AEPD). Utilidades puras + acceso a
// document.cookie desde cliente. La cookie es propia y granular:
// `ak_cookie_consent=analytics%3Dtrue` (ampliable a más categorías).

export const CONSENT_COOKIE_NAME = "ak_cookie_consent";
/** 12 meses, máximo recomendado por la AEPD para conservar la elección. */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Evento global: la elección de consentimiento ha cambiado. */
export const CONSENT_CHANGED_EVENT = "ak-consent-changed";
/** Evento global: reabrir el banner de configuración de cookies. */
export const CONSENT_OPEN_EVENT = "ak-consent-open";

export type CookieConsent = {
  /** Cookies de analítica/medición (GA4, Meta Pixel). */
  analytics: boolean;
};

/** Parsea el valor granular de la cookie ("analytics=true"). Null si no es válido. */
export function parseConsent(value: string | null | undefined): CookieConsent | null {
  if (!value) return null;
  const params = new URLSearchParams(value);
  const analytics = params.get("analytics");
  if (analytics !== "true" && analytics !== "false") return null;
  return { analytics: analytics === "true" };
}

/** Serializa la elección al formato granular guardado en la cookie. */
export function serializeConsent(consent: CookieConsent): string {
  return `analytics=${consent.analytics}`;
}

/** Lee la elección actual desde document.cookie (solo cliente). */
export function readConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const prefix = `${CONSENT_COOKIE_NAME}=`;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  if (!raw) return null;
  return parseConsent(decodeURIComponent(raw.slice(prefix.length)));
}

/** Guarda la elección (12 meses) y avisa al resto de la página sin recargar. */
export function writeConsent(consent: CookieConsent): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(serializeConsent(consent));
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}
