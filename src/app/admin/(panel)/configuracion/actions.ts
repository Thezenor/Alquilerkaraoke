"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { SITE_CONFIG_TAG } from "@/server/site-config";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  companyName: z.string().trim().min(1, "El nombre de empresa es obligatorio."),
  phone: z.string().trim().min(1, "El teléfono es obligatorio."),
  legalName: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  email: z.union([z.literal(""), z.email("Email no válido.")]).optional(),
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().optional(),
  primaryColor: z
    .union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex no válido (ej. #22d3ee).")])
    .optional(),
  logoUrl: z.string().trim().max(500).optional(),
  faviconUrl: z.string().trim().max(500).optional(),
  ogImageUrl: z.string().trim().max(500).optional(),
  instagram: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  facebook: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  tiktok: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  youtube: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  twitter: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  iban: z.string().trim().max(40).optional(),
  bizum: z.string().trim().max(40).optional(),
  paymentInfo: z.string().trim().max(1000).optional(),
  contractTerms: z.string().trim().max(8000).optional(),
  gaMeasurementId: z
    .union([z.literal(""), z.string().regex(/^G-[A-Z0-9]{4,}$/i, "ID de GA4 no válido (ej. G-XXXXXXXXXX).")])
    .optional(),
  gscVerification: z.string().trim().max(200).optional(),
  metaPixelId: z.union([z.literal(""), z.string().regex(/^\d{6,20}$/, "El Pixel ID son solo dígitos.")]).optional(),
  quoteTerms: z.string().trim().max(8000).optional(),
  // SEO local (LocalBusiness): todos opcionales; solo se publican si se rellenan.
  addressStreet: z.string().trim().max(200).optional(),
  addressCity: z.string().trim().max(100).optional(),
  addressRegion: z.string().trim().max(100).optional(),
  addressPostalCode: z
    .union([z.literal(""), z.string().regex(/^\d{5}$/, "Código postal no válido (5 dígitos).")])
    .optional(),
  openingHours: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .max(200)
        .regex(
          /^[A-Z][a-z](-[A-Z][a-z])?\s+\d{1,2}:\d{2}-\d{1,2}:\d{2}(\s*,\s*[A-Z][a-z](-[A-Z][a-z])?\s+\d{1,2}:\d{2}-\d{1,2}:\d{2})*$/,
          'Horario no válido. Formato schema.org, ej. "Mo-Su 09:00-21:00".',
        ),
    ])
    .optional(),
  latitude: z
    .union([z.literal(""), z.coerce.number().min(-90, "Latitud fuera de rango.").max(90, "Latitud fuera de rango.")])
    .optional(),
  longitude: z
    .union([z.literal(""), z.coerce.number().min(-180, "Longitud fuera de rango.").max(180, "Longitud fuera de rango.")])
    .optional(),
});

export type ConfigFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const orNull = (v?: string) => (v && v.length ? v : null);

export async function updateSiteConfig(
  _prev: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
  // Solo SUPERADMIN/ADMIN pueden editar la configuración.
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para editar la configuración." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos no válidos.";
    return { status: "error", message: first };
  }

  const d = parsed.data;
  const data = {
    companyName: d.companyName,
    phone: d.phone,
    legalName: orNull(d.legalName),
    taxId: orNull(d.taxId),
    email: orNull(d.email),
    whatsapp: orNull(d.whatsapp),
    address: orNull(d.address),
    primaryColor: orNull(d.primaryColor),
    logoUrl: orNull(d.logoUrl),
    faviconUrl: orNull(d.faviconUrl),
    ogImageUrl: orNull(d.ogImageUrl),
    instagram: orNull(d.instagram),
    facebook: orNull(d.facebook),
    tiktok: orNull(d.tiktok),
    youtube: orNull(d.youtube),
    twitter: orNull(d.twitter),
    iban: orNull(d.iban),
    bizum: orNull(d.bizum),
    paymentInfo: orNull(d.paymentInfo),
    contractTerms: orNull(d.contractTerms),
    gaMeasurementId: orNull(d.gaMeasurementId),
    gscVerification: orNull(d.gscVerification),
    metaPixelId: orNull(d.metaPixelId),
    quoteTerms: orNull(d.quoteTerms),
    addressStreet: orNull(d.addressStreet),
    addressCity: orNull(d.addressCity),
    addressRegion: orNull(d.addressRegion),
    addressPostalCode: orNull(d.addressPostalCode),
    openingHours: orNull(d.openingHours),
    latitude: typeof d.latitude === "number" ? d.latitude : null,
    longitude: typeof d.longitude === "number" ? d.longitude : null,
  };
  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  await logAudit({
    userId,
    action: "config.update",
    entity: "SiteConfig",
    entityId: "default",
  });

  // Refresca la web pública (que cachea SiteConfig por tag).
  updateTag(SITE_CONFIG_TAG);

  return { status: "success", message: "Configuración guardada correctamente." };
}
