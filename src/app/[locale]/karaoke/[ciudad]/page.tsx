import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { CITIES, getCity } from "@/lib/cities";

type Item = { title: string; text: string };

export function generateStaticParams() {
  return CITIES.map((c) => ({ ciudad: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ciudad: string }>;
}): Promise<Metadata> {
  const { locale, ciudad } = await params;
  const city = getCity(ciudad);
  if (!city) return {};
  const t = await getTranslations({ locale, namespace: "CityLandingMeta" });
  return buildMetadata({
    locale,
    pathname: `/karaoke/${ciudad}`,
    title: t("title", { city: city.name }),
    description: t("description", { city: city.name }),
  });
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ locale: string; ciudad: string }>;
}) {
  const { locale, ciudad } = await params;
  const city = getCity(ciudad);
  if (!city) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("CityLanding");
  const services = (await getTranslations("HomeServices")).raw("items") as Item[];

  const faq = [1, 2, 3].map((i) => ({
    q: t(`faqQ${i}`, { city: city.name }),
    a: t(`faqA${i}`, { city: city.name }),
  }));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Alquiler de karaoke",
      areaServed: { "@type": "City", name: city.name },
      provider: { "@type": "LocalBusiness", name: "Alquiler Karaoke" },
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
  ];

  const otherCities = CITIES.filter((c) => c.slug !== ciudad);

  return (
    <>
      <JsonLd data={schema} />

      <section className="py-16 sm:py-20">
        <Container>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {t("title", { city: city.name })}
          </h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{t("intro", { city: city.name })}</p>

          <div className="mt-8">
            <Button href={`/${locale}/contacto`} size="lg">
              {t("ctaTitle", { city: city.name })}
            </Button>
          </div>

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

          {/* Otras ciudades */}
          <h2 className="mt-14 text-xl font-semibold text-white">{t("otherCitiesTitle")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {otherCities.map((c) => (
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
