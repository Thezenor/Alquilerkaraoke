import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const TESTIMONIALS_TAG = "testimonials";

/** Testimonios activos, ordenados, para la web pública (cacheado). */
export const getActiveTestimonials = unstable_cache(
  async () => {
    try {
      return await prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });
    } catch {
      return [];
    }
  },
  [`${TESTIMONIALS_TAG}-active`],
  { tags: [TESTIMONIALS_TAG], revalidate: 3600 },
);

type LocalizableTestimonial = { locale: string };

/**
 * Testimonios del locale pedido; si el idioma no tiene ninguno, se usan los
 * de "es" como fallback (mejor mostrar prueba social real que nada).
 */
export function testimonialsForLocale<T extends LocalizableTestimonial>(
  items: T[],
  locale: string,
): T[] {
  const ofLocale = items.filter((t) => t.locale === locale);
  if (ofLocale.length > 0) return ofLocale;
  return items.filter((t) => t.locale === "es");
}
