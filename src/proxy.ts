import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { authConfig } from "@/server/auth/auth.config";
import { canAccessAdmin } from "@/lib/auth-roles";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

// Host canónico derivado de NEXT_PUBLIC_SITE_URL. Si la request llega por otro
// host (p. ej. el subdominio *.railway.app cuando el dominio propio ya esté
// conectado y la variable apunte a él), se responde con X-Robots-Tag noindex
// para evitar indexación duplicada entre dominios. Hoy la variable apunta al
// host de Railway, así que no se activa; queda armado para el cambio de dominio.
// No se redirige aún: el dominio canónico todavía no está conectado.
const canonicalHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").host || null;
  } catch {
    return null;
  }
})();

/** Añade noindex a la respuesta si la request no llega por el host canónico. */
function withHostGuard(requestHost: string | null, res: Response | undefined): Response | undefined {
  if (!canonicalHost || !requestHost || requestHost === canonicalHost) return res;
  const out = res ?? NextResponse.next();
  try {
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
  } catch {
    // Las respuestas de Response.redirect tienen headers inmutables; una
    // redirección no necesita noindex, así que se ignora.
  }
  return out;
}

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  const res = ((): Response | undefined => {
    // ── Panel admin: autenticación + rol, sin i18n ──
    if (pathname.startsWith("/admin")) {
      const isLoggedIn = !!req.auth?.user;
      const roles = req.auth?.user?.roles;
      const isLoginPage = pathname === "/admin/login";

      if (isLoginPage) {
        if (isLoggedIn && canAccessAdmin(roles)) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return; // continúa
      }
      if (!isLoggedIn) {
        const url = new URL("/admin/login", nextUrl);
        url.searchParams.set("callbackUrl", pathname);
        return Response.redirect(url);
      }
      if (!canAccessAdmin(roles)) {
        const url = new URL("/admin/login", nextUrl);
        url.searchParams.set("error", "AccessDenied");
        return Response.redirect(url);
      }
      return; // continúa
    }

    // ── Firma pública de contratos: ruta agnóstica de idioma (sin prefijo) ──
    if (pathname.startsWith("/contrato")) {
      return; // continúa sin i18n
    }

    // ── Resto de rutas: routing i18n público ──
    return intlMiddleware(req);
  })();

  // Host real de la request: tras un proxy (Railway) llega en x-forwarded-host;
  // nextUrl.host puede venir normalizado al host del servidor.
  const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return withHostGuard(requestHost, res);
});

export const config = {
  // Excluye API, assets internos de Next, ficheros de metadata (OG/iconos) y
  // ficheros estáticos (con extensión). El resto pasa por i18n/auth.
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|icon|apple-icon|manifest|.*\\..*).*)"],
};
