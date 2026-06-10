"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CONSENT_OPEN_EVENT, readConsent, writeConsent } from "@/lib/cookie-consent";
import { useCookieConsentValue } from "@/lib/use-cookie-consent";

/**
 * Banner de consentimiento de cookies (RGPD/AEPD). Aceptar y rechazar son
 * igual de accesibles; la elección se guarda 12 meses en una cookie propia.
 * Se puede reabrir desde "Configurar cookies" en el footer (evento global).
 */
export function CookieBanner() {
  const t = useTranslations("CookieBanner");
  const locale = useLocale();
  // Estado reactivo de la cookie: "ssr" | "none" | elección guardada.
  const consent = useCookieConsentValue();
  const [forcedOpen, setForcedOpen] = useState(false);

  // Reapertura desde "Configurar cookies" (footer / página de cookies).
  useEffect(() => {
    const reopen = () => setForcedOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const choose = useCallback((analytics: boolean) => {
    const previous = readConsent();
    writeConsent({ analytics });
    setForcedOpen(false);
    // Al retirar un consentimiento ya concedido, recarga para descargar los
    // scripts de terceros ya inyectados (aceptar sí se aplica sin recargar).
    if (previous?.analytics === true && !analytics) {
      window.location.reload();
    }
  }, []);

  const open = forcedOpen || consent === "none";
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-2xl shadow-black/50 sm:p-5">
        <h2 className="text-sm font-semibold text-white">{t("title")}</h2>
        <p className="mt-1.5 text-sm text-brand-muted">
          {t("text")}{" "}
          <Link
            href={`/${locale}/cookies`}
            className="text-brand-neon underline underline-offset-2 transition hover:text-brand-neon-strong"
          >
            {t("more")}
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose(true)}
            className="min-h-11 w-full rounded-full bg-brand-neon px-6 py-2.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong sm:w-auto"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={() => choose(false)}
            className="min-h-11 w-full rounded-full border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-text transition hover:border-brand-neon/60 sm:w-auto"
          >
            {t("reject")}
          </button>
        </div>
      </div>
    </div>
  );
}
