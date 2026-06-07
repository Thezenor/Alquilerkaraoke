import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const BLOG_TAG = "blog";

/** Entradas publicadas de un idioma (cacheado por tag). */
export const getPublishedPosts = unstable_cache(
  async (locale: string) => {
    try {
      return await prisma.post.findMany({
        where: { status: "PUBLISHED", locale, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      });
    } catch {
      return [];
    }
  },
  ["blog-published"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

/** Entrada publicada por slug. */
export const getPublishedPostBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.post.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { not: null } } });
    } catch {
      return null;
    }
  },
  ["blog-post"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

/** Slugs+locale de todas las entradas publicadas (para el sitemap). */
export async function getPublishedPostRefs(): Promise<{ slug: string; locale: string; updatedAt: Date }[]> {
  try {
    return await prisma.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      select: { slug: true, locale: true, updatedAt: true },
    });
  } catch {
    return [];
  }
}
