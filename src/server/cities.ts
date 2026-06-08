import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const CITIES_TAG = "cities";

/** Ciudades activas, ordenadas para el hub y el sitemap. */
export const getActiveCities = unstable_cache(
  async () => {
    try {
      return await prisma.city.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    } catch {
      return [];
    }
  },
  [`${CITIES_TAG}-active`],
  { tags: [CITIES_TAG], revalidate: 3600 },
);

/** Ciudad activa por slug (para la landing). */
export const getCityBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.city.findFirst({ where: { slug, isActive: true } });
    } catch {
      return null;
    }
  },
  [`${CITIES_TAG}-by-slug`],
  { tags: [CITIES_TAG], revalidate: 3600 },
);
