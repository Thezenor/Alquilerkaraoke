import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Alquiler Karaoke";

export function absoluteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

/**
 * Metadata SEO por página: canonical + hreflang correctos para la ruta concreta.
 * @param pathname ruta SIN prefijo de idioma (ej. "" para home, "/servicios").
 */
export function buildMetadata({
  locale,
  pathname = "",
  title,
  description,
  images,
  noindex = false,
}: {
  locale: string;
  pathname?: string;
  title: string;
  description: string;
  images?: string[];
  noindex?: boolean;
}): Metadata {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `/${l}${pathname}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${pathname}`;

  const canonical = `/${locale}${pathname}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale,
      type: "website",
      // Si no se pasan imágenes, Next usa la convención `opengraph-image`.
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
