import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CITIES } from "@/lib/cities";
import { getActivePacks } from "@/server/packs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Incluye packs desde BD: render en runtime.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const packs = await getActivePacks();

  // Rutas públicas (sin prefijo de idioma).
  const publicPaths = [
    "",
    "/servicios",
    "/packs",
    "/presupuesto",
    "/contacto",
    "/privacidad",
    ...packs.map((p) => `/packs/${p.slug}`),
    ...CITIES.map((c) => `/karaoke/${c.slug}`),
  ];

  return publicPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
      },
    })),
  );
}
