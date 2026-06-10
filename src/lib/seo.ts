import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Alquiler Karaoke";

/** Sufijo de marca para títulos de página. Único punto de definición. */
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

/** Título de página con sufijo de marca, sin duplicarlo si ya lo lleva. */
export function pageTitle(title: string): string {
  return title.endsWith(TITLE_SUFFIX) ? title : `${title}${TITLE_SUFFIX}`;
}

/** @id del nodo Organization/LocalBusiness del JSON-LD global ([locale]/layout.tsx). */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function absoluteUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

const SCHEMA_DAYS: [string, string][] = [
  ["Mo", "Monday"],
  ["Tu", "Tuesday"],
  ["We", "Wednesday"],
  ["Th", "Thursday"],
  ["Fr", "Friday"],
  ["Sa", "Saturday"],
  ["Su", "Sunday"],
];

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

/**
 * Convierte horario en texto schema.org ("Mo-Su 09:00-21:00", admite varios
 * tramos separados por coma) en OpeningHoursSpecification para el JSON-LD.
 * Devuelve null si el formato no se reconoce (el llamador cae al texto plano).
 */
export function openingHoursToSpec(value: string): OpeningHoursSpecification[] | null {
  const codes = SCHEMA_DAYS.map(([code]) => code);
  const names = Object.fromEntries(SCHEMA_DAYS);
  const specs: OpeningHoursSpecification[] = [];

  for (const part of value.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^([A-Z][a-z])(?:-([A-Z][a-z]))?\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!m) return null;
    const [, from, to, opens, closes] = m;
    const fromIdx = codes.indexOf(from);
    const toIdx = to ? codes.indexOf(to) : fromIdx;
    if (fromIdx < 0 || toIdx < 0) return null;
    const range =
      fromIdx <= toIdx
        ? codes.slice(fromIdx, toIdx + 1)
        : [...codes.slice(fromIdx), ...codes.slice(0, toIdx + 1)];
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: range.map((c) => names[c]),
      opens,
      closes,
    });
  }
  return specs.length ? specs : null;
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
