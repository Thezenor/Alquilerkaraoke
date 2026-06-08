import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SERVICES_TAG = "services";

export const getActiveServices = unstable_cache(
  async () => {
    try {
      return await prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    } catch {
      return [];
    }
  },
  [`${SERVICES_TAG}-active`],
  { tags: [SERVICES_TAG], revalidate: 3600 },
);

export const getServiceBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.service.findFirst({ where: { slug, isActive: true } });
    } catch {
      return null;
    }
  },
  [`${SERVICES_TAG}-by-slug`],
  { tags: [SERVICES_TAG], revalidate: 3600 },
);

type Tr = { name?: string; shortDescription?: string; description?: string };

/** Nombre/descripciones del servicio en el idioma dado, con fallback al base (ES). */
export function localizedService(
  service: { name: string; shortDescription: string | null; description: string | null; translations: unknown },
  locale: string,
) {
  const all = (service.translations ?? {}) as Record<string, Tr>;
  const t = all[locale] ?? {};
  return {
    name: t.name ?? service.name,
    shortDescription: t.shortDescription ?? service.shortDescription ?? "",
    description: t.description ?? service.description ?? "",
  };
}
