import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { CITIES } from "@/lib/cities";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Rutas públicas (sin prefijo de idioma).
const publicPaths = [
  "",
  "/servicios",
  "/contacto",
  ...CITIES.map((c) => `/karaoke/${c.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}
