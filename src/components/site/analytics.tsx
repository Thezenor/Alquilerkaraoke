"use client";

import Script from "next/script";
import { parseConsent } from "@/lib/cookie-consent";
import { useCookieConsentValue } from "@/lib/use-cookie-consent";

/**
 * Inyecta scripts de analítica solo si están configurados desde el admin Y el
 * visitante ha aceptado las cookies de analítica (RGPD: sin consentimiento no
 * se carga ningún script de terceros). Al aceptar desde el banner se activa
 * sin recargar (el valor de consentimiento es reactivo).
 * Carga diferida (afterInteractive) para no penalizar los Core Web Vitals.
 */
export function Analytics({
  gaMeasurementId,
  metaPixelId,
}: {
  gaMeasurementId?: string | null;
  metaPixelId?: string | null;
}) {
  const consent = useCookieConsentValue();
  const allowed = parseConsent(consent)?.analytics === true;

  if (!allowed) return null;

  return (
    <>
      {gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}');`}
          </Script>
        </>
      )}

      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
