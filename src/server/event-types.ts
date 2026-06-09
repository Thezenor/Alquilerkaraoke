import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const EVENT_TYPES_TAG = "event-types";

export type EventFaq = { q: string; a: string };

export const getActiveEventTypes = unstable_cache(
  async () => {
    try {
      return await prisma.eventType.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    } catch {
      return [];
    }
  },
  [`${EVENT_TYPES_TAG}-active`],
  { tags: [EVENT_TYPES_TAG], revalidate: 3600 },
);

export const getEventTypeBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.eventType.findFirst({ where: { slug, isActive: true } });
    } catch {
      return null;
    }
  },
  [`${EVENT_TYPES_TAG}-by-slug`],
  { tags: [EVENT_TYPES_TAG], revalidate: 3600 },
);

type Tr = { name?: string; shortDescription?: string; intro?: string; description?: string; metaTitle?: string; metaDescription?: string };

/** Textos del tipo de evento en el idioma dado, con fallback al base (ES). */
export function localizedEventType(
  e: {
    name: string;
    shortDescription: string | null;
    intro: string | null;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    translations: unknown;
  },
  locale: string,
) {
  const all = (e.translations ?? {}) as Record<string, Tr>;
  const t = all[locale] ?? {};
  return {
    name: t.name ?? e.name,
    shortDescription: t.shortDescription ?? e.shortDescription ?? "",
    intro: t.intro ?? e.intro ?? "",
    description: t.description ?? e.description ?? "",
    metaTitle: t.metaTitle ?? e.metaTitle ?? "",
    metaDescription: t.metaDescription ?? e.metaDescription ?? "",
  };
}
