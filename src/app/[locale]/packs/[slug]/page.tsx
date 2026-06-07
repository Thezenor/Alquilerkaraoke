import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { formatCents, centsToEuros } from "@/lib/money";
import { getPackBySlug, localizedPack } from "@/server/packs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pack = await getPackBySlug(slug);
  if (!pack) return {};
  const l = localizedPack(pack, locale);
  const t = await getTranslations({ locale, namespace: "PacksPage" });
  return buildMetadata({
    locale,
    pathname: `/packs/${slug}`,
    title: `${l.name} | Alquiler Karaoke`,
    description: l.shortDescription || `${l.name} — ${t("from")} ${formatCents(pack.basePrice)} ${t("vat")}.`,
  });
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pack = await getPackBySlug(slug);
  if (!pack) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("PacksPage");
  const l = localizedPack(pack, locale);

  const deposit =
    pack.depositType === "PERCENT" ? `${pack.depositValue}%` : formatCents(pack.depositValue);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: l.name,
    description: l.description || l.shortDescription || l.name,
    offers: {
      "@type": "Offer",
      price: centsToEuros(pack.basePrice),
      priceCurrency: "EUR",
      url: absoluteUrl(`/${locale}/packs/${slug}`),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{l.name}</h1>

          <div className="mt-4">
            <span className="text-sm text-brand-muted">{t("from")}</span>{" "}
            <span className="text-3xl font-bold text-brand-neon">{formatCents(pack.basePrice)}</span>
            <span className="ml-1 text-sm text-brand-muted">
              {t("vat")}
              {pack.isPerDay ? ` · ${t("perDay")}` : ""}
            </span>
          </div>

          {l.description && (
            <p className="mt-6 whitespace-pre-wrap text-brand-muted">{l.description}</p>
          )}

          {/* Detalles */}
          <h2 className="mt-10 text-lg font-semibold text-white">{t("detailsTitle")}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {!pack.isPerDay && pack.includedHours > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <dt className="text-xs uppercase tracking-wide text-brand-muted">
                  {t("includedHours", { hours: pack.includedHours })}
                </dt>
              </div>
            )}
            {pack.extraHourPrice > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <dt className="text-xs uppercase tracking-wide text-brand-muted">{t("extraHourLabel")}</dt>
                <dd className="mt-1 font-medium text-white">{formatCents(pack.extraHourPrice)}</dd>
              </div>
            )}
            <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
              <dt className="text-xs uppercase tracking-wide text-brand-muted">{t("depositLabel")}</dt>
              <dd className="mt-1 font-medium text-white">{deposit}</dd>
            </div>
            {pack.securityDeposit > 0 && (
              <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                <dt className="text-xs uppercase tracking-wide text-brand-muted">{t("securityDepositLabel")}</dt>
                <dd className="mt-1 font-medium text-white">{formatCents(pack.securityDeposit)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-10">
            <Button href={`/${locale}/contacto`} size="lg">
              {t("ctaQuote")}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
