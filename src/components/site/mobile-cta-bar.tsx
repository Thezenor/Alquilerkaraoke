"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

/**
 * Barra de conversión fija inferior, solo móvil (<sm), en páginas públicas:
 * pedir presupuesto (primario), llamar y WhatsApp.
 *
 * - Se oculta en /presupuesto (el usuario ya está en el objetivo).
 * - z-40: por debajo del banner de cookies (z-50), que debe quedar encima.
 * - Respeta safe-area-inset-bottom y añade un espaciador en el flujo para que
 *   la barra no tape el final del footer.
 */
export function MobileCtaBar({
  phone,
  phoneHref,
  whatsappUrl,
}: {
  phone: string;
  phoneHref: string;
  whatsappUrl: string;
}) {
  const t = useTranslations("MobileCta");
  const locale = useLocale();
  const pathname = usePathname();

  // Segundo segmento de la ruta (tras el locale): /es/presupuesto → "presupuesto".
  const section = pathname?.split("/")[2] ?? "";
  if (section === "presupuesto") return null;

  return (
    <>
      {/* Espaciador en flujo: evita que la barra tape el final de la página */}
      <div aria-hidden className="h-[calc(4.25rem+env(safe-area-inset-bottom))] sm:hidden" />

      <nav
        aria-label={t("ariaLabel")}
        className="border-brand-border/60 bg-brand-bg/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <div className="flex h-16 items-center gap-2 px-3">
          <a
            href={phoneHref}
            aria-label={`${t("call")}: ${phone}`}
            className="border-brand-border text-brand-text hover:border-brand-neon/60 focus-visible:ring-brand-neon/50 inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-full border transition focus-visible:ring-2 focus-visible:outline-none"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            className="border-brand-border focus-visible:ring-brand-neon/50 inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-full border text-[#25D366] transition hover:border-[#25D366]/60 focus-visible:ring-2 focus-visible:outline-none"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.14 1.02-2.43.27-.29.59-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.03.89 2.18.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.16-.29.37-.41.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.6.76 1.87.9.27.13.45.2.51.31.07.11.07.66-.17 1.34Z" />
            </svg>
          </a>
          <a
            href={`/${locale}/presupuesto`}
            className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong focus-visible:ring-brand-neon/50 inline-flex h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold shadow-[0_8px_30px_-8px_rgba(34,211,238,0.5)] transition focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("quote")}
          </a>
        </div>
      </nav>
    </>
  );
}
