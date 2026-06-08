import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { getContact } from "@/server/site-config";
import { getActiveCollaborators } from "@/server/collaborators";
import { buildMetadata, absoluteUrl } from "@/lib/seo";

// ISR: la home se regenera periódicamente para reflejar datos de BD (servicios
// del menú, colaboradores) sin sacrificar el rendimiento de página estática.
export const revalidate = 300;

type Item = { title: string; text: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return buildMetadata({
    locale,
    pathname: "",
    title: t("homeTitle"),
    description: t("homeDescription"),
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const services = (await getTranslations("HomeServices")).raw("items") as Item[];
  const segments = (await getTranslations("HomeSegments")).raw("items") as Item[];
  const steps = (await getTranslations("HomeProcess")).raw("steps") as Item[];
  const contact = await getContact();
  const collaborators = await getActiveCollaborators();

  // Service / OfferCatalog: ayuda a Google a entender la oferta de la home.
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Alquiler de karaoke y eventos",
    provider: { "@type": "Organization", name: contact.companyName, url: absoluteUrl(`/${locale}`) },
    areaServed: { "@type": "Country", name: "España" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t("servicesTitle"),
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.text },
      })),
    },
  };

  return (
    <>
      <JsonLd data={serviceSchema} />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-neon/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-magenta/10 blur-3xl"
        />
        <Container className="relative py-20 text-center sm:py-28">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] text-brand-neon uppercase">
            {t("heroKicker")}
          </p>
          <h1 className="text-glow mx-auto max-w-3xl text-4xl leading-[1.1] font-bold text-white sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-brand-muted sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={`/${locale}/presupuesto`} size="lg" className="w-full sm:w-auto">
              {t("ctaQuote")}
            </Button>
            <Button
              href={contact.whatsappUrl}
              variant="secondary"
              size="lg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              {t("ctaWhatsapp")}
            </Button>
          </div>
        </Container>
      </section>

      {/* SERVICIOS */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("servicesTitle")}</h2>
          <p className="mt-2 max-w-2xl text-brand-muted">{t("servicesSubtitle")}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article
                key={s.title}
                className="rounded-2xl border border-brand-border bg-brand-surface p-6 transition hover:border-brand-neon/50"
              >
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-muted">{s.text}</p>
              </article>
            ))}
          </div>
          {/* Enlazado interno hacia las secciones clave (SEO) */}
          <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={t("exploreTitle")}>
            {[
              { href: `/${locale}/servicios`, label: t("linkServices") },
              { href: `/${locale}/packs`, label: t("linkPacks") },
              { href: `/${locale}/karaoke`, label: t("linkCities") },
              { href: `/${locale}/canciones`, label: t("linkSongs") },
              { href: `/${locale}/blog`, label: t("linkBlog") },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-brand-neon underline-offset-4 transition hover:underline">
                {l.label} →
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      {/* SEGMENTOS */}
      <section className="bg-brand-surface py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("segmentsTitle")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((s) => (
              <article key={s.title} className="rounded-2xl border border-brand-border bg-brand-bg p-6">
                <h3 className="font-semibold text-brand-neon">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-muted">{s.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* PROCESO */}
      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("processTitle")}</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="text-3xl font-bold text-brand-neon/40">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-brand-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* COLABORADORES */}
      {collaborators.length > 0 && (
        <section className="bg-brand-surface py-16 sm:py-20">
          <Container>
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">{t("collaboratorsTitle")}</h2>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {collaborators.map((c) => {
                const inner = c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt={c.name} loading="lazy" className="max-h-12 w-auto object-contain" />
                ) : (
                  <span className="font-semibold text-white">{c.name}</span>
                );
                return (
                  <li key={c.id}>
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        title={c.name}
                        className="flex h-20 min-w-[140px] items-center justify-center rounded-xl border border-brand-border bg-brand-bg px-6 transition hover:border-brand-neon/50"
                      >
                        {inner}
                      </a>
                    ) : (
                      <span className="flex h-20 min-w-[140px] items-center justify-center rounded-xl border border-brand-border bg-brand-bg px-6">
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      )}

      {/* CTA BAND */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center sm:p-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("ctaBandTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-muted">{t("ctaBandText")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={`/${locale}/presupuesto`} size="lg" className="w-full sm:w-auto">
                {t("ctaQuote")}
              </Button>
              <Button
                href={contact.whatsappUrl}
                variant="secondary"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                {t("ctaWhatsapp")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
