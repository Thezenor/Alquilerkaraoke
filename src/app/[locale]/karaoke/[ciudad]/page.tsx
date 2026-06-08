import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { Markdown } from "@/lib/markdown";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { getActiveCities, getCityBySlug } from "@/server/cities";
import { regionLabel, variantIndex } from "@/lib/cities";

// Ciudades en BD (gestionables desde el admin): render dinámico, consulta cacheada por tag.
export const dynamic = "force-dynamic";

type Item = { title: string; text: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ciudad: string }>;
}): Promise<Metadata> {
  const { locale, ciudad } = await params;
  const city = await getCityBySlug(ciudad);
  if (!city) return {};
  const t = await getTranslations({ locale, namespace: "CityLandingMeta" });
  return buildMetadata({
    locale,
    pathname: `/karaoke/${ciudad}`,
    title: city.metaTitle?.trim() || t("title", { city: city.name }),
    description:
      city.metaDescription?.trim() ||
      t("description", { city: city.name, province: city.province, region: regionLabel(city.region, locale) }),
  });
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ locale: string; ciudad: string }>;
}) {
  const { locale, ciudad } = await params;
  const city = await getCityBySlug(ciudad);
  if (!city) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("CityLanding");
  const services = (await getTranslations("HomeServices")).raw("items") as Item[];
  const allCities = await getActiveCities();

  // Diferenciación por ciudad: región traducida, poblaciones reales en el texto e
  // intro rotada de forma determinista → cada landing tiene contenido único (anti-duplicado).
  const region = regionLabel(city.region, locale);
  const nearby1 = city.nearby[0] ?? city.name;
  const nearby2 = city.nearby[1] ?? nearby1;
  const tp = { city: city.name, province: city.province, region, nearby1, nearby2 } as const;
  const introKeys = ["intro", "introB", "introC"] as const;
  const introKey = introKeys[variantIndex(city.slug, introKeys.length)];

  const faq = [1, 2, 3].map((i) => ({
    q: t(`faqQ${i}`, tp),
    a: t(`faqA${i}`, tp),
  }));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Alquiler de karaoke",
      areaServed: { "@type": "City", name: city.name, containedInPlace: { "@type": "AdministrativeArea", name: city.region } },
      provider: { "@type": "LocalBusiness", name: "Alquiler Karaoke", url: absoluteUrl(`/${locale}`), telephone: "+34607724965" },
      url: absoluteUrl(`/${locale}/karaoke/${ciudad}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Alquiler Karaoke", item: absoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: t("breadcrumb"), item: absoluteUrl(`/${locale}/karaoke`) },
        { "@type": "ListItem", position: 3, name: city.name, item: absoluteUrl(`/${locale}/karaoke/${ciudad}`) },
      ],
    },
  ];

  const others = allCities.filter((c) => c.slug !== ciudad);
  const sameRegion = others.filter((c) => c.region === city.region);
  const restCities = others.filter((c) => c.region !== city.region);

  return (
    <>
      <JsonLd data={schema} />

      <section className="py-16 sm:py-20">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-brand-muted" aria-label="Breadcrumb">
            <Link href={`/${locale}/karaoke`} className="transition hover:text-brand-neon">
              {t("breadcrumb")}
            </Link>
            <span className="mx-2 text-brand-muted/50">/</span>
            <span className="text-white">{city.name}</span>
          </nav>

          <p className="text-sm font-medium tracking-wide text-brand-neon uppercase">{region}</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            {t("title", { city: city.name })}
          </h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{city.intro?.trim() || t(introKey, tp)}</p>
          {city.population != null && city.population > 0 && (
            <p className="mt-2 max-w-2xl text-sm text-brand-muted/80">
              {t("populationNote", { city: city.name, population: city.population })}
            </p>
          )}

          <div className="mt-8">
            <Button href={`/${locale}/contacto`} size="lg">
              {t("ctaTitle", { city: city.name })}
            </Button>
          </div>

          {/* Contenido único editorial por ciudad (Markdown, opcional desde admin) */}
          {city.body?.trim() && (
            <div className="mt-12 max-w-2xl">
              <Markdown source={city.body} />
            </div>
          )}

          {/* Servicios */}
          <h2 className="mt-14 text-xl font-semibold text-white">
            {t("servicesTitle", { city: city.name })}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article
                key={s.title}
                className="rounded-2xl border border-brand-border bg-brand-surface p-6"
              >
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-muted">{s.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-brand-muted">
            <Link href={`/${locale}/servicios`} className="text-brand-neon underline-offset-2 hover:underline">
              {t("allServices")}
            </Link>
          </p>

          {/* Cobertura: poblaciones cercanas (contenido local único) */}
          <h2 className="mt-14 text-xl font-semibold text-white">{t("coverageTitle", { city: city.name })}</h2>
          <p className="mt-2 max-w-2xl text-sm text-brand-muted">{t("coverageText", { city: city.name, province: city.province })}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {city.nearby.map((town) => (
              <li
                key={town}
                className="inline-block rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-sm text-brand-muted"
              >
                {town}
              </li>
            ))}
          </ul>

          {/* FAQ */}
          <h2 className="mt-14 text-xl font-semibold text-white">{t("faqTitle")}</h2>
          <dl className="mt-6 space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-brand-border bg-brand-surface p-5">
                <dt className="font-medium text-white">{f.q}</dt>
                <dd className="mt-1 text-sm text-brand-muted">{f.a}</dd>
              </div>
            ))}
          </dl>

          {/* CTA */}
          <div className="mt-14 rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">{t("ctaTitle", { city: city.name })}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-muted">
              {t("ctaText", { city: city.name })}
            </p>
            <div className="mt-6">
              <Button href={`/${locale}/contacto`} size="lg">
                {t("ctaTitle", { city: city.name })}
              </Button>
            </div>
          </div>

          {/* Otras ciudades: primero las de la misma comunidad (clúster semántico) */}
          {sameRegion.length > 0 && (
            <>
              <h2 className="mt-14 text-xl font-semibold text-white">{t("otherCitiesRegionTitle", { region })}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {sameRegion.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${locale}/karaoke/${c.slug}`}
                      className="inline-block rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-neon/60 hover:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="mt-14 text-xl font-semibold text-white">{t("otherCitiesTitle")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {restCities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${locale}/karaoke/${c.slug}`}
                  className="inline-block rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-neon/60 hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
