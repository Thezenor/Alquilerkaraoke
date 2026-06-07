import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const COLLABORATORS_TAG = "collaborators";

/** Marcas colaboradoras activas, ordenadas, para la web pública (cacheado). */
export const getActiveCollaborators = unstable_cache(
  async () => {
    try {
      return await prisma.collaborator.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    } catch {
      return [];
    }
  },
  [`${COLLABORATORS_TAG}-active`],
  { tags: [COLLABORATORS_TAG], revalidate: 3600 },
);
