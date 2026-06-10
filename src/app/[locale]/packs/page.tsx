import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
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
  return buildMetadata({ locale, pathname: "/packs", title: t("title"), description: t("description") });
}

export default async function PacksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PacksPage");
  const packs = await getActivePacks();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-brand-muted">{t("intro")}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const l = localizedPack(pack, locale);
            const subtitle = l.shortDescription || descriptionToFeatures(l.description).slice(0, 2).join(" · ");
            return (
              <article
                key={pack.id}
                className={
                  pack.isFeatured
                    ? "relative flex flex-col overflow-hidden rounded-2xl border border-brand-neon/60 bg-brand-surface shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:border-brand-neon"
                    : "flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition hover:border-brand-neon/50"
                }
              >
                {pack.isFeatured && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-brand-neon px-3 py-1 text-xs font-semibold text-brand-bg">
                    {t("mostPopular")}
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={packImage(pack)}
                  alt={pack.imageAlt || l.name}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-semibold text-white">{l.name}</h2>
                {subtitle && (
                  <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{subtitle}</p>
                )}

                <div className="mt-4">
                  <span className="text-xs text-brand-muted">{t("from")}</span>
                  <div className="text-2xl font-bold text-brand-neon">
                    {formatCents(pack.basePrice, locale)}
                    <span className="ml-1 text-sm font-normal text-brand-muted">
                      {t("vat")}
                      {pack.isPerDay ? ` · ${t("perDay")}` : ""}
                    </span>
                  </div>
                  {!pack.isPerDay && pack.includedHours > 0 && (
                    <p className="mt-1 text-xs text-brand-muted">
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
