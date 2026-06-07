import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { getActivePacks, localizedPack } from "@/server/packs";
import { getActiveExtras, getProvinces } from "@/server/pricing";
import { QuoteForm, type QuoteOptions } from "./quote-form";

// Lee packs/extras/suplementos de BD en runtime.
export const dynamic = "force-dynamic";

type ExtraTr = { name?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PresupuestoMeta" });
  return buildMetadata({ locale, pathname: "/presupuesto", title: t("title"), description: t("description") });
}

export default async function PresupuestoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Quote");
  const [packs, extras, provinces] = await Promise.all([
    getActivePacks(),
    getActiveExtras(),
    getProvinces(),
  ]);

  const options: QuoteOptions = {
    packs: packs.map((p) => ({
      id: p.id,
      name: localizedPack(p, locale).name,
      includedHours: p.includedHours,
    })),
    extras: extras.map((e) => {
      const tr = (e.translations ?? {}) as Record<string, ExtraTr>;
      return { id: e.id, name: tr[locale]?.name ?? e.name, price: e.price };
    }),
    provinces: provinces.map((p) => p.name),
  };

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-brand-muted">{t("intro")}</p>
        <div className="mt-10">
          <QuoteForm options={options} />
        </div>
      </Container>
    </section>
  );
}
