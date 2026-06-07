import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";

import { routing } from "@/i18n/routing";
import { authConfig } from "@/server/auth/auth.config";
import { canAccessAdmin } from "@/lib/auth-roles";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

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
});

export const config = {
  // Excluye API, assets internos de Next, ficheros de metadata (OG/iconos) y
  // ficheros estáticos (con extensión). El resto pasa por i18n/auth.
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|icon|apple-icon|manifest|.*\\..*).*)"],
};
