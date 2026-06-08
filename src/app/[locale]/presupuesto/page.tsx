import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { getActivePacks, localizedPack } from "@/server/packs";
import { getActiveExtras, getProvinces } from "@/server/pricing";
import { getContact } from "@/server/site-config";
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

export default async function PresupuestoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pack?: string }>;
}) {
  const { locale } = await params;
  const { pack: packSlug } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Quote");
  const [packs, extras, provinces, contact] = await Promise.all([
    getActivePacks(),
    getActiveExtras(),
    getProvinces(),
    getContact(),
  ]);

  const options: QuoteOptions = {
    packs: packs.map((p) => ({ id: p.id, name: localizedPack(p, locale).name, category: p.category })),
    extras: extras.map((e) => {
      const tr = (e.translations ?? {}) as Record<string, ExtraTr>;
      return { id: e.id, name: tr[locale]?.name ?? e.name, category: e.category };
    }),
    provinces: provinces.map((p) => p.name),
  };

  // Pack preseleccionado al venir desde la ficha de un pack (?pack=slug).
  const selectedPack = packSlug ? packs.find((p) => p.slug === packSlug) : null;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-brand-muted">{t("intro")}</p>
        <div className="mt-10">
          <QuoteForm
            options={options}
            defaultPackId={selectedPack?.id ?? null}
            defaultPackName={selectedPack ? localizedPack(selectedPack, locale).name : null}
            whatsappUrl={contact.whatsappUrl}
          />
        </div>
      </Container>
    </section>
  );
}
