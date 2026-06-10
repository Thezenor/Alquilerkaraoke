import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { markdownToPlain } from "@/lib/markdown";

export const BLOG_TAG = "blog";

/**
 * Entradas publicadas de un idioma para el listado (cacheado por tag).
 * Select acotado: el `content` completo no viaja a la página; si no hay
 * excerpt se deriva aquí un resumen en texto plano y se cachea ya recortado.
 */
export const getPublishedPosts = unstable_cache(
  async (locale: string) => {
    try {
      const posts = await prisma.post.findMany({
        where: { status: "PUBLISHED", locale, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      });
      return posts.map(({ content, excerpt, ...p }) => ({
        ...p,
        excerpt: excerpt || markdownToPlain(content, 140),
      }));
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
