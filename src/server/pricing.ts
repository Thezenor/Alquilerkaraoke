import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const PRICING_TAG = "pricing";

export const getPricingConfig = unstable_cache(
  async () => {
    try {
      return await prisma.pricingConfig.findUnique({ where: { id: "default" } });
    } catch {
      return null;
    }
  },
  [`${PRICING_TAG}-config`],
  { tags: [PRICING_TAG], revalidate: 3600 },
);

export const getActiveExtras = unstable_cache(
  async () => {
    try {
      return await prisma.extra.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    } catch {
      return [];
    }
  },
  [`${PRICING_TAG}-extras`],
  { tags: [PRICING_TAG], revalidate: 3600 },
);

export const getProvinceSupplements = unstable_cache(
  async () => {
    try {
      return await prisma.provinceSupplement.findMany({
        where: { isActive: true },
        orderBy: { province: "asc" },
      });
    } catch {
      return [];
    }
  },
  [`${PRICING_TAG}-supplements`],
  { tags: [PRICING_TAG], revalidate: 3600 },
);
