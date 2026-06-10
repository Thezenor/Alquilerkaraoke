import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DEFAULT_QUOTE_TERMS } from "@/lib/legal-terms";
import { isAIConfigured } from "@/server/ai";
import { ConfigForm, type ConfigValues } from "./config-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración de empresa · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ConfigPage() {
  const c = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  const aiConfigured = await isAIConfigured();

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
    quoteTerms: c?.quoteTerms ?? DEFAULT_QUOTE_TERMS,
    addressStreet: c?.addressStreet ?? "",
    addressCity: c?.addressCity ?? "",
    addressRegion: c?.addressRegion ?? "",
    addressPostalCode: c?.addressPostalCode ?? "",
    openingHours: c?.openingHours ?? "",
    latitude: c?.latitude != null ? String(c.latitude) : "",
    longitude: c?.longitude != null ? String(c.longitude) : "",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Configuración de empresa</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Estos datos se muestran en la web pública (contacto, WhatsApp). Al guardar se refresca
        automáticamente.
      </p>

      {/* Estado de la IA (lee la variable de entorno del servidor; no expone la clave) */}
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-sm">
        <span className="text-brand-muted">Integración de IA:</span>
        {aiConfigured ? (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-300">✓ Conectada (ANTHROPIC_API_KEY detectada)</span>
        ) : (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-300">⚠ No configurada — añádela en la sección IA</span>
        )}
        <Link href="/admin/ia" className="ml-auto text-brand-neon underline-offset-2 hover:underline">Gestionar IA →</Link>
      </div>

      <div className="mt-8">
        <ConfigForm values={values} />
      </div>
    </div>
  );
}
