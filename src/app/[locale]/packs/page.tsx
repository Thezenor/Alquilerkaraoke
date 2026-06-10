import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { SmartImage } from "@/components/site/smart-image";
import { buildMetadata } from "@/lib/seo";
import { formatCents } from "@/lib/money";
import { getActivePacks, localizedPack } from "@/server/packs";
import { packImage, descriptionToFeatures } from "@/lib/pack-image";

// Catálogo desde BD: render en runtime (la BD no es accesible en build).
// getActivePacks va cacheado (tag PACKS_TAG) para rendimiento.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PacksMeta" });
  return buildMetadata({
    locale,
    pathname: "/packs",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PacksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PacksPage");
  const packs = await getActivePacks();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="text-brand-muted mt-3 max-w-2xl">{t("intro")}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const l = localizedPack(pack, locale);
            const subtitle =
              l.shortDescription || descriptionToFeatures(l.description).slice(0, 2).join(" · ");
            return (
              <article
                key={pack.id}
                className={
                  pack.isFeatured
                    ? "card-lift border-brand-neon/60 bg-brand-surface hover:border-brand-neon relative flex flex-col overflow-hidden rounded-2xl border shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                    : "card-lift border-brand-border bg-brand-surface hover:border-brand-neon/50 flex flex-col overflow-hidden rounded-2xl border"
                }
              >
                {pack.isFeatured && (
                  <span className="bg-brand-neon text-brand-bg absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-semibold">
                    {t("mostPopular")}
                  </span>
                )}
                <div className="relative aspect-[16/10] w-full">
                  <SmartImage
                    src={packImage(pack)}
                    alt={pack.imageAlt || l.name}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-lg font-semibold text-white">{l.name}</h2>
                  {subtitle && (
                    <p className="text-brand-muted mt-1 line-clamp-2 text-sm">{subtitle}</p>
                  )}

                  <div className="mt-4">
                    <span className="text-brand-muted text-xs">{t("from")}</span>
                    <div className="text-brand-neon text-2xl font-bold">
                      {formatCents(pack.basePrice, locale)}
                      <span className="text-brand-muted ml-1 text-sm font-normal">
                        {t("vat")}
                        {pack.isPerDay ? ` · ${t("perDay")}` : ""}
                      </span>
                    </div>
                    {!pack.isPerDay && pack.includedHours > 0 && (
                      <p className="text-brand-muted mt-1 text-xs">
                        {t("includedHours", { hours: pack.includedHours })}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <Button href={`/${locale}/packs/${pack.slug}`} variant="secondary" size="md">
                      {t("viewDetails")}
                    </Button>
                    <Button href={`/${locale}/presupuesto?pack=${pack.slug}`} size="md">
                      {t("ctaQuote")}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
