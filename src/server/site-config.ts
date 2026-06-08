import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Valores por defecto si aún no hay fila en BD o falla la consulta. */
const DEFAULTS = {
  companyName: "Alquiler Karaoke",
  phone: "607724965",
};

export const SITE_CONFIG_TAG = "site-config";

/**
 * Lee la configuración de empresa/branding (singleton).
 * Cacheado con tag para mantener render estático; el módulo admin (Bloque 6)
 * podrá invalidar con `revalidateTag(SITE_CONFIG_TAG)`.
 */
export const getSiteConfig = unstable_cache(
  async () => {
    try {
      return await prisma.siteConfig.findUnique({ where: { id: "default" } });
    } catch {
      return null;
    }
  },
  [SITE_CONFIG_TAG],
  { tags: [SITE_CONFIG_TAG], revalidate: 3600 },
);

/** Normaliza un número español a formato wa.me (prefijo 34). */
function toWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 9 ? `34${digits}` : digits;
}

/** Datos de contacto listos para la UI, con fallbacks seguros. */
export async function getContact() {
  const config = await getSiteConfig();
  const companyName = config?.companyName ?? DEFAULTS.companyName;
  const phone = config?.phone ?? DEFAULTS.phone;
  const whatsappRaw = config?.whatsapp ?? phone;

  return {
    companyName,
    phone,
    phoneHref: `tel:+34${phone.replace(/\D/g, "")}`,
    email: config?.email || null,
    whatsappUrl: `https://wa.me/${toWhatsappNumber(whatsappRaw)}`,
    primaryColor: config?.primaryColor || null,
    socials: {
      instagram: config?.instagram || null,
      facebook: config?.facebook || null,
      tiktok: config?.tiktok || null,
      youtube: config?.youtube || null,
      twitter: config?.twitter || null,
    },
  };
}
