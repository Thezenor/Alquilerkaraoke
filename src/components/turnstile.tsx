"use client";

import Script from "next/script";

// Widget de Cloudflare Turnstile. Solo se renderiza si hay site key pública.
// Cloudflare inyecta dentro del formulario un input "cf-turnstile-response" con
// el token, que se verifica en el servidor. Sin clave → no renderiza nada (no-op).
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <div className="mt-4">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="dark" />
    </div>
  );
}
