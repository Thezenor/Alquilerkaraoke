import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CITIES } from "@/lib/cities";
import { getActivePacks } from "@/server/packs";
import { getPublishedPostRefs } from "@/server/blog";
import { getActiveServices } from "@/server/services";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Incluye packs/posts desde BD: render en runtime.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packs, posts, services] = await Promise.all([
    getActivePacks(),
    getPublishedPostRefs(),
    getActiveServices(),
  ]);

  // Rutas públicas comunes a todos los idiomas (sin prefijo).
  const publicPaths = [
    "",
    "/servicios",
    "/packs",
    "/canciones",
    "/blog",
    "/faq",
    "/presupuesto",
    "/contacto",
    "/privacidad",
    "/karaoke",
    ...services.map((s) => `/servicios/${s.slug}`),
    ...packs.map((p) => `/packs/${p.slug}`),
    ...CITIES.map((c) => `/karaoke/${c.slug}`),
  ];

  const common = publicPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
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
