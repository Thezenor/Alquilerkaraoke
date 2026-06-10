import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl, pageTitle, ORGANIZATION_ID } from "@/lib/seo";
import { formatCents } from "@/lib/money";
import { Markdown, markdownToPlain } from "@/lib/markdown";
import { getServiceBySlug, localizedService } from "@/server/services";
import { getActivePacks, localizedPack } from "@/server/packs";
import { SmartImage } from "@/components/site/smart-image";

// ISR (patrón karaoke/[ciudad]): generación bajo demanda + caché de HTML estático.
// Datos cacheados por tags SERVICES_TAG/PACKS_TAG, invalidados desde el admin con updateTag.
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
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const l = localizedService(service, locale);
  return buildMetadata({
    locale,
    pathname: `/servicios/${slug}`,
    title: service.metaTitle || pageTitle(l.name),
    description: service.metaDescription || l.shortDescription || markdownToPlain(l.description),
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");
  const tp = await getTranslations("PacksPage");
  const l = localizedService(service, locale);

  // Packs de la categoría asociada al servicio.
  const allPacks = await getActivePacks();
  const packs = service.category ? allPacks.filter((p) => p.category === service.category) : [];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: l.name,
    description: l.shortDescription || markdownToPlain(l.description),
    areaServed: "ES",
    // Referencia al nodo Organization/LocalBusiness global del layout (grafo conectado).
    provider: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(`/${locale}/servicios/${slug}`),
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container className="max-w-4xl">
          {service.heroImageUrl && (
            <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-brand-border">
              <SmartImage
                src={service.heroImageUrl}
                alt={l.name}
                priority
                sizes="(min-width: 896px) 832px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <h1 className="text-3xl font-bold text-white sm:text-4xl">{l.name}</h1>
          {l.shortDescription && <p className="mt-3 max-w-2xl text-lg text-brand-muted">{l.shortDescription}</p>}

          {l.description && (
            <div className="mt-8">
              <Markdown source={l.description} />
            </div>
          )}

          {packs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-white">{t("packsInService")}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => {
                  const pl = localizedPack(pack, locale);
                  return (
                    <article
                      key={pack.id}
                      className="flex flex-col rounded-2xl border border-brand-border bg-brand-surface p-5"
                    >
                      <h3 className="font-semibold text-white">{pl.name}</h3>
                      <div className="mt-2">
                        <span className="text-xs text-brand-muted">{tp("from")}</span>{" "}
                        <span className="text-xl font-bold text-brand-neon">{formatCents(pack.basePrice, locale)}</span>
                        <span className="ml-1 text-xs text-brand-muted">{tp("vat")}</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button href={`/${locale}/packs/${pack.slug}`} variant="secondary" size="md">
                          {tp("viewDetails")}
                        </Button>
                        <Button href={`/${locale}/presupuesto?pack=${pack.slug}`} size="md">
                          {tp("ctaQuote")}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-muted">{t("ctaText")}</p>
            <div className="mt-6">
              <Button href={`/${locale}/presupuesto`} size="lg">
                {tp("ctaQuote")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
