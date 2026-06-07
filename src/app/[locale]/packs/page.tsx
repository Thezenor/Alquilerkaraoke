import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { formatCents } from "@/lib/money";
import { getActivePacks, localizedPack } from "@/server/packs";

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
            return (
              <article
                key={pack.id}
                className="flex flex-col rounded-2xl border border-brand-border bg-brand-surface p-6 transition hover:border-brand-neon/50"
              >
                <h2 className="text-lg font-semibold text-white">{l.name}</h2>
                {l.shortDescription && (
                  <p className="mt-1 text-sm text-brand-muted">{l.shortDescription}</p>
                )}

                <div className="mt-4">
                  <span className="text-xs text-brand-muted">{t("from")}</span>
                  <div className="text-2xl font-bold text-brand-neon">
                    {formatCents(pack.basePrice)}
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
                  <Button href={`/${locale}/contacto`} size="md">
                    {t("ctaQuote")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
