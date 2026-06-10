import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { Markdown, markdownToPlain } from "@/lib/markdown";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { getActiveEventTypes, getEventTypeBySlug, localizedEventType, type EventFaq } from "@/server/event-types";
import { SmartImage } from "@/components/site/smart-image";

// ISR (patrón karaoke/[ciudad]): no se prerenderiza en build (sin BD en Railway),
// pero cada ficha se genera bajo demanda y se cachea como HTML estático.
// Los datos van cacheados por tag EVENT_TYPES_TAG y el admin los invalida con updateTag.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const e = await getEventTypeBySlug(slug);
  if (!e) return {};
  const l = localizedEventType(e, locale);
  return buildMetadata({
    locale,
    pathname: `/eventos/${slug}`,
    title: l.metaTitle || `${l.name} | Alquiler Karaoke`,
    description: l.metaDescription || l.shortDescription || markdownToPlain(l.description),
    ...(e.heroImageUrl ? { images: [e.heroImageUrl] } : {}),
  });
}

export default async function EventTypePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const e = await getEventTypeBySlug(slug);
  if (!e) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("EventDetail");
  const l = localizedEventType(e, locale);
  const features = (e.features as string[] | null) ?? [];
  const faq = (e.faq as EventFaq[] | null) ?? [];
  const others = (await getActiveEventTypes()).filter((o) => o.slug !== slug);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: l.name,
      description: l.shortDescription || markdownToPlain(l.description),
      areaServed: { "@type": "Country", name: "España" },
      provider: { "@type": "LocalBusiness", name: "Alquiler Karaoke", url: absoluteUrl(`/${locale}`), telephone: "+34607724965" },
      url: absoluteUrl(`/${locale}/eventos/${slug}`),
    },
    ...(faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Alquiler Karaoke", item: absoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: t("breadcrumb"), item: absoluteUrl(`/${locale}/eventos`) },
        { "@type": "ListItem", position: 3, name: l.name, item: absoluteUrl(`/${locale}/eventos/${slug}`) },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container>
          <nav className="mb-6 text-sm text-brand-muted" aria-label="Breadcrumb">
            <Link href={`/${locale}/eventos`} className="transition hover:text-brand-neon">
              {t("breadcrumb")}
            </Link>
            <span className="mx-2 text-brand-muted/50">/</span>
            <span className="text-white">{l.name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">{l.name}</h1>
          {l.intro && <p className="mt-4 max-w-2xl text-lg text-brand-muted">{l.intro}</p>}

          <div className="mt-8">
            <Button href={`/${locale}/presupuesto`} size="lg">
              {t("requestQuote")}
            </Button>
          </div>

          {e.heroImageUrl && (
            <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-brand-border">
              <SmartImage
                src={e.heroImageUrl}
                alt={l.name}
                priority
                sizes="(min-width: 1152px) 1088px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="max-w-2xl">{l.description && <Markdown source={l.description} />}</div>

            {features.length > 0 && (
              <aside className="h-fit rounded-2xl border border-brand-border bg-brand-surface p-6">
                <h2 className="text-sm font-semibold tracking-wide text-brand-neon uppercase">{t("featuresTitle")}</h2>
                <ul className="mt-4 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-brand-text">
                      <span className="mt-0.5 text-brand-neon">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>

          {faq.length > 0 && (
            <>
              <h2 className="mt-14 text-xl font-semibold text-white">{t("faqTitle")}</h2>
              <dl className="mt-6 space-y-4">
                {faq.map((f) => (
                  <div key={f.q} className="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <dt className="font-medium text-white">{f.q}</dt>
                    <dd className="mt-1 text-sm text-brand-muted">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {/* CTA */}
          <div className="mt-14 rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-muted">{t("ctaText")}</p>
            <div className="mt-6">
              <Button href={`/${locale}/presupuesto`} size="lg">
                {t("requestQuote")}
              </Button>
            </div>
          </div>

          {/* Otros eventos */}
          {others.length > 0 && (
            <>
              <h2 className="mt-14 text-xl font-semibold text-white">{t("otherTitle")}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/${locale}/eventos/${o.slug}`}
                      className="inline-block rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-neon/60 hover:text-white"
                    >
                      {localizedEventType(o, locale).name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
