import { unstable_cache } from "next/cache";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const GALLERIES_TAG = "galleries";

/** ¿La galería ha caducado? */
export function isExpired(g: { expiresAt: Date | null }): boolean {
  return g.expiresAt != null && g.expiresAt.getTime() < Date.now();
}

/** Galerías listadas (para el hub público): activas, marcadas como listadas y no caducadas. */
export const getListedGalleries = unstable_cache(
  async () => {
    try {
      const rows = await prisma.gallery.findMany({
        where: { isListed: true, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImageUrl: true,
          expiresAt: true,
          passwordHash: true,
          _count: { select: { items: true } },
        },
      });
      return rows
        .filter((g) => !isExpired(g))
        .map((g) => ({
          slug: g.slug,
          title: g.title,
          description: g.description,
          coverImageUrl: g.coverImageUrl,
          itemCount: g._count.items,
          locked: g.passwordHash != null,
        }));
    } catch {
      return [];
    }
  },
  [`${GALLERIES_TAG}-listed`],
  { tags: [GALLERIES_TAG], revalidate: 3600 },
);

/**
 * Galería activa por slug, SIN elementos: la página decide primero si está
 * caducada o bloqueada por clave y solo entonces pide los items con
 * getGalleryItems (evita cargar todos los medios para acabar mostrando el candado).
 */
export const getGalleryBySlug = unstable_cache(
  async (slug: string) => {
    try {
      return await prisma.gallery.findFirst({ where: { slug, isActive: true } });
    } catch {
      return null;
    }
  },
  [`${GALLERIES_TAG}-by-slug`],
  { tags: [GALLERIES_TAG], revalidate: 3600 },
);

/** Elementos de una galería, ordenados (cacheado por tag). */
export const getGalleryItems = unstable_cache(
  async (galleryId: string) => {
    try {
      return await prisma.galleryItem.findMany({
        where: { galleryId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
    } catch {
      return [];
    }
  },
  [`${GALLERIES_TAG}-items`],
  { tags: [GALLERIES_TAG], revalidate: 3600 },
);

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";

/** Token de acceso a una galería protegida (HMAC del id). */
export function galleryToken(galleryId: string): string {
  return createHmac("sha256", SECRET).update(`gallery:${galleryId}`).digest("hex");
}

/** Nombre de la cookie de acceso para una galería. */
export function galleryCookieName(galleryId: string): string {
  return `gal_${galleryId}`;
}

/** Verifica el token de acceso (comparación en tiempo constante). */
export function verifyGalleryToken(galleryId: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = galleryToken(galleryId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
