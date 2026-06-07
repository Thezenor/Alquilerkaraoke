import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const PACKS_TAG = "packs";

/** Packs activos, ordenados — cacheado por tag (para páginas públicas, Bloque 3). */
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
