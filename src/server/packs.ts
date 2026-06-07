import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const PACKS_TAG = "packs";

/** Packs activos, ordenados — cacheado por tag (para páginas públicas). */
export const getActivePacks = unstable_cache(
  async () => {
    try {
      return await prisma.pack.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      return [];
    }
  },
  [PACKS_TAG],
  { tags: [PACKS_TAG], revalidate: 3600 },
);

/** Pack activo por slug (cacheado; la clave incluye el slug). */
export const getPackBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.pack.findFirst({ where: { slug, isActive: true } });
    } catch {
      return null;
    }
  },
  ["pack-by-slug"],
  { tags: [PACKS_TAG], revalidate: 3600 },
);

type Translatable = {
  name: string;
  shortDescription: string | null;
  description: string | null;
  translations: unknown;
};
type Tr = { name?: string; shortDescription?: string; description?: string };

/** Devuelve nombre/descripciones del pack en el idioma dado, con fallback al base (ES). */
export function localizedPack(pack: Translatable, locale: string) {
  const all = (pack.translations ?? {}) as Record<string, Tr>;
  const t = all[locale] ?? {};
  return {
    name: t.name ?? pack.name,
    shortDescription: t.shortDescription ?? pack.shortDescription ?? "",
    description: t.description ?? pack.description ?? "",
  };
}
