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

export const getProvinces = unstable_cache(
  async () => {
    try {
      return await prisma.province.findMany({
        where: { isActive: true },
        include: { zone: true },
        orderBy: { name: "asc" },
      });
    } catch {
      return [];
    }
  },
  [`${PRICING_TAG}-provinces`],
  { tags: [PRICING_TAG], revalidate: 3600 },
);

export const getTariffZones = unstable_cache(
  async () => {
    try {
      return await prisma.tariffZone.findMany({ orderBy: { sortOrder: "asc" } });
    } catch {
      return [];
    }
  },
  [`${PRICING_TAG}-zones`],
  { tags: [PRICING_TAG], revalidate: 3600 },
);
