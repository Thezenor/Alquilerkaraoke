import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ConfigForm, type ConfigValues } from "./config-form";

export const metadata: Metadata = {
  title: "Configuración de empresa · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ConfigPage() {
  const c = await prisma.siteConfig.findUnique({ where: { id: "default" } });

  const values: ConfigValues = {
    companyName: c?.companyName ?? "",
    legalName: c?.legalName ?? "",
    taxId: c?.taxId ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    whatsapp: c?.whatsapp ?? "",
    address: c?.address ?? "",
    primaryColor: c?.primaryColor ?? "",
    logoUrl: c?.logoUrl ?? "",
    faviconUrl: c?.faviconUrl ?? "",
    ogImageUrl: c?.ogImageUrl ?? "",
    instagram: c?.instagram ?? "",
    facebook: c?.facebook ?? "",
    tiktok: c?.tiktok ?? "",
    youtube: c?.youtube ?? "",
    twitter: c?.twitter ?? "",
    iban: c?.iban ?? "",
    bizum: c?.bizum ?? "",
    paymentInfo: c?.paymentInfo ?? "",
    contractTerms: c?.contractTerms ?? "",
    gaMeasurementId: c?.gaMeasurementId ?? "",
    gscVerification: c?.gscVerification ?? "",
    metaPixelId: c?.metaPixelId ?? "",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Configuración de empresa</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Estos datos se muestran en la web pública (contacto, WhatsApp). Al guardar se refresca
        automáticamente.
      </p>

      <div className="mt-8">
        <ConfigForm values={values} />
      </div>
    </div>
  );
}
