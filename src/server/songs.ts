import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SONGS_TAG = "songs";

/**
 * Optimiza el catálogo: marca isPrimary la mejor versión de cada Título+Intérprete
 * (la marca con mayor "quality"; desempate por id). El resto queda isPrimary=false.
 * Hecho en SQL para que escale a cientos de miles de filas.
 */
export async function optimizeCatalog(): Promise<{ total: number; unique: number }> {
  await prisma.$executeRawUnsafe('UPDATE "Song" SET "isPrimary" = true');
  await prisma.$executeRawUnsafe(`
    WITH ranked AS (
      SELECT s.id, row_number() OVER (
        PARTITION BY s."dedupKey"
        ORDER BY COALESCE(b."quality", 0) DESC, s.id ASC
      ) AS rn
      FROM "Song" s LEFT JOIN "SongBrand" b ON b.id = s."brandId"
    )
    UPDATE "Song" SET "isPrimary" = false
    FROM ranked WHERE "Song".id = ranked.id AND ranked.rn > 1
  `);
  const [total, unique] = await Promise.all([
    prisma.song.count(),
    prisma.song.count({ where: { isPrimary: true } }),
  ]);
  return { total, unique };
}

/** Estadísticas del catálogo: total importado y total de canciones no repetidas. */
export const getCatalogStats = unstable_cache(
  async () => {
    try {
      const [total, unique] = await Promise.all([
        prisma.song.count(),
        prisma.song.count({ where: { isPrimary: true } }),
      ]);
      return { total, unique };
    } catch {
      return { total: 0, unique: 0 };
    }
  },
  ["songs-stats"],
  { tags: [SONGS_TAG], revalidate: 3600 },
);

/** Nº de canciones (no repetidas) por idioma, de mayor a menor. */
export const getLanguageCounts = unstable_cache(
  async () => {
    try {
      const rows = await prisma.song.groupBy({
        by: ["languageCode"],
        where: { isPrimary: true },
        _count: { _all: true },
      });
      return rows
        .map((r) => ({ code: r.languageCode, count: r._count._all }))
        .sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  },
  ["songs-lang-counts"],
  { tags: [SONGS_TAG], revalidate: 3600 },
);

export type SongSearchResult = {
  items: { id: string; title: string; performer: string; languageCode: string; brand: { name: string } | null }[];
  total: number;
  page: number;
  totalPages: number;
};

/** Búsqueda paginada en el catálogo (solo versiones primarias). */
export async function searchSongs(opts: {
  q?: string;
  lang?: string;
  page?: number;
  pageSize?: number;
}): Promise<SongSearchResult> {
  const pageSize = Math.min(100, opts.pageSize ?? 30);
  const page = Math.max(1, opts.page ?? 1);
  const q = (opts.q ?? "").trim();
  const where = {
    isPrimary: true,
    ...(opts.lang ? { languageCode: opts.lang } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { performer: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  try {
    const [items, total] = await Promise.all([
      prisma.song.findMany({
        where,
        orderBy: [{ title: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          performer: true,
          languageCode: true,
          brand: { select: { name: true } },
        },
      }),
      prisma.song.count({ where }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / pageSize) };
  } catch {
    return { items: [], total: 0, page: 1, totalPages: 0 };
  }
}
