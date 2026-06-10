import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { getContact } from "@/server/site-config";
import { getActiveCollaborators } from "@/server/collaborators";
import { getActiveTestimonials, testimonialsForLocale } from "@/server/testimonials";
import { buildMetadata, absoluteUrl } from "@/lib/seo";

// ISR: la home se regenera periódicamente para reflejar datos de BD (servicios
// del menú, colaboradores) sin sacrificar el rendimiento de página estática.
export const revalidate = 300;

type Item = { title: string; text: string };

// Iconos del equipo profesional (orden = items de HomeEquipment): pantalla, micrófono,
// sonido, iluminación, canciones, montaje. SVG inline, sin dependencias.
const EQUIPMENT_ICONS = [
  <path key="screen" d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  <g key="mic">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
  </g>,
  <g key="sound">
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a9 9 0 0 1 0 13" />
  </g>,
  <g key="light">
    <path d="m9 18 6-2M10 14l4-1.5M11 10l3-1" />
    <path d="M13 3 5 14h6l-1 7 9-12h-6l1-6Z" />
  </g>,
  <g key="songs">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </g>,
  <g key="setup">
    <path d="M10 17h4V5H2v12h2M14 9h4l3 3v5h-2" />
    <circle cx="7.5" cy="17.5" r="2" />
    <circle cx="17.5" cy="17.5" r="2" />
  </g>,
];

/** Estrellas de valoración (SVG accesible, 1–5). */
function RatingStars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex gap-0.5 text-brand-neon">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={i < rating ? "h-4 w-4" : "h-4 w-4 opacity-25"}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

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
  const equipment = (await getTranslations("HomeEquipment")).raw("items") as Item[];
  const services = (await getTranslations("HomeServices")).raw("items") as Item[];
  const segments = (await getTranslations("HomeSegments")).raw("items") as Item[];
  const steps = (await getTranslations("HomeProcess")).raw("steps") as Item[];
  const contact = await getContact();
  const collaborators = await getActiveCollaborators();
  const allTestimonials = await getActiveTestimonials();
  const testimonials = testimonialsForLocale(allTestimonials, locale);

  // AggregateRating + Review: solo si hay testimonios reales en BD.
  const rated = allTestimonials.filter((t) => t.rating >= 1 && t.rating <= 5);
  const ratingSchema =
    rated.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (rated.reduce((sum, t) => sum + t.rating, 0) / rated.length).toFixed(1),
            reviewCount: rated.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: testimonials.slice(0, 3).map((t) => ({
            "@type": "Review",
            author: { "@type": "Person", name: t.authorName },
            reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5, worstRating: 1 },
            reviewBody: t.quote,
            ...(t.eventType ? { name: t.eventType } : {}),
          })),
        }
      : {};

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
    ...ratingSchema,
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

      {/* EQUIPO PROFESIONAL (iconos) */}
      <section className="border-y border-brand-border/60 bg-brand-surface py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("equipmentTitle")}</h2>
          <p className="mt-2 max-w-2xl text-brand-muted">{t("equipmentSubtitle")}</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((e, i) => (
              <li key={e.title} className="flex gap-4 rounded-2xl border border-brand-border bg-brand-bg p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-neon/10 text-brand-neon">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {EQUIPMENT_ICONS[i]}
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-white">{e.title}</h3>
                  <p className="mt-1 text-sm text-brand-muted">{e.text}</p>
                </div>
              </li>
            ))}
          </ul>
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

      {/* TESTIMONIOS (prueba social) */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("testimonialsTitle")}</h2>
            <p className="mt-2 max-w-2xl text-brand-muted">{t("testimonialsSubtitle")}</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item) => (
                <li key={item.id}>
                  <figure className="flex h-full flex-col rounded-2xl border border-brand-border bg-brand-surface p-6 transition hover:border-brand-neon/50">
                    <RatingStars rating={item.rating} label={t("ratingLabel", { rating: item.rating })} />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-brand-text">
                      “{item.quote}”
                    </blockquote>
                    <figcaption className="mt-5">
                      <p className="font-semibold text-white">{item.authorName}</p>
                      {item.eventType && <p className="mt-0.5 text-sm text-brand-muted">{item.eventType}</p>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

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
