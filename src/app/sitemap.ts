import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getActiveCities } from "@/server/cities";
import { getActiveEventTypes } from "@/server/event-types";
import { getListedGalleries } from "@/server/galleries";
import { getActivePacks } from "@/server/packs";
import { getPublishedPostRefs } from "@/server/blog";
import { getActiveServices } from "@/server/services";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Incluye packs/posts desde BD: render en runtime.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packs, posts, services, cities, galleries, eventTypes] = await Promise.all([
    getActivePacks(),
    getPublishedPostRefs(),
    getActiveServices(),
    getActiveCities(),
    getListedGalleries(),
    getActiveEventTypes(),
  ]);

  // Rutas públicas comunes a todos los idiomas (sin prefijo). Las fichas de BD
  // llevan lastModified real (updatedAt); las estáticas no lo declaran (mejor
  // omitirlo que mentir con new Date() en cada request).
  const publicPaths: { path: string; lastModified?: Date }[] = [
    "",
    "/servicios",
    "/packs",
    "/canciones",
    "/blog",
    "/faq",
    "/presupuesto",
    "/contacto",
    "/privacidad",
    "/aviso-legal",
    "/terminos",
    "/cookies",
    "/karaoke",
    "/galerias",
    "/eventos",
  ]
    .map((path) => ({ path }))
    .concat(
      eventTypes.map((e) => ({ path: `/eventos/${e.slug}`, lastModified: e.updatedAt })),
      services.map((s) => ({ path: `/servicios/${s.slug}`, lastModified: s.updatedAt })),
      packs.map((p) => ({ path: `/packs/${p.slug}`, lastModified: p.updatedAt })),
      cities.map((c) => ({ path: `/karaoke/${c.slug}`, lastModified: c.updatedAt })),
      // Solo galerías listadas (las protegidas/no listadas van noindex y fuera del sitemap).
      galleries
        .filter((g) => !g.locked)
        .map((g) => ({ path: `/galerias/${g.slug}`, lastModified: g.updatedAt })),
    );

  const common = publicPaths.flatMap(({ path, lastModified }) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: {
        languages: {
          ...Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
          // x-default: la versión en el idioma por defecto (ES).
          "x-default": `${siteUrl}/${routing.defaultLocale}${path}`,
        },
      },
    })),
  );

  // Entradas del blog: una entrada en su propio idioma (no replicada por locale).
  const blog = posts.map((p) => ({
    url: `${siteUrl}/${p.locale}/blog/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...common, ...blog];
}
