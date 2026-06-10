import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { getActiveCities } from "@/server/cities";
import { getActiveServices, localizedService } from "@/server/services";

export const dynamic = "force-dynamic";

type Item = { title: string; text: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ServicesMeta" });
  return buildMetadata({
    locale,
    pathname: "/servicios",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");
  const cl = await getTranslations("CityLanding");
  const staticServices = (await getTranslations("HomeServices")).raw("items") as Item[];
  const dbServices = await getActiveServices();
  const cities = await getActiveCities();

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="text-brand-muted mt-3 max-w-2xl">{t("intro")}</p>

          <h2 className="mt-12 text-xl font-semibold text-white">{t("servicesTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dbServices.length > 0
              ? dbServices.map((s) => {
                  const l = localizedService(s, locale);
                  return (
                    <Link
                      key={s.id}
                      href={`/${locale}/servicios/${s.slug}`}
                      className="card-lift group border-brand-border bg-brand-surface hover:border-brand-neon/50 rounded-2xl border p-6"
                    >
                      <h3 className="font-semibold text-white">{l.name}</h3>
                      {l.shortDescription && (
                        <p className="text-brand-muted mt-2 text-sm">{l.shortDescription}</p>
                      )}
                      <span className="text-brand-neon mt-3 inline-block text-sm font-medium">
                        {t("viewService")} →
                      </span>
                    </Link>
                  );
                })
              : staticServices.map((s) => (
                  <article
                    key={s.title}
                    className="border-brand-border bg-brand-surface rounded-2xl border p-6"
                  >
                    <h3 className="font-semibold text-white">{s.title}</h3>
                    <p className="text-brand-muted mt-2 text-sm">{s.text}</p>
                  </article>
                ))}
          </div>

          {/* Enlaces internos a ciudades */}
          <h2 className="mt-14 text-xl font-semibold text-white">{cl("otherCitiesTitle")}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${locale}/karaoke/${c.slug}`}
                  className="border-brand-border text-brand-muted hover:border-brand-neon/60 inline-block rounded-full border px-3 py-1.5 text-sm transition hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="border-brand-border from-brand-surface-2 to-brand-surface mt-14 rounded-3xl border bg-gradient-to-br p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="text-brand-muted mx-auto mt-2 max-w-xl">{t("ctaText")}</p>
            <div className="mt-6">
              <Button href={`/${locale}/contacto`} size="lg">
                {t("ctaTitle")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
