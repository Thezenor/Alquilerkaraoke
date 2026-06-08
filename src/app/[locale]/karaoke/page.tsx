import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { citiesByRegion } from "@/lib/cities";
import { getActiveCities } from "@/server/cities";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CitiesHubMeta" });
  return buildMetadata({
    locale,
    pathname: "/karaoke",
    title: t("title"),
    description: t("description"),
  });
}

export default async function CitiesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CitiesHub");
  const cities = await getActiveCities();
  const groups = citiesByRegion(cities);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: cities.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        url: absoluteUrl(`/${locale}/karaoke/${c.slug}`),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Alquiler Karaoke", item: absoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: t("title"), item: absoluteUrl(`/${locale}/karaoke`) },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={schema} />

      <section className="py-16 sm:py-20">
        <Container>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{t("intro")}</p>

          <div className="mt-10 space-y-10">
            {groups.map((g) => (
              <div key={g.region}>
                <h2 className="text-sm font-semibold tracking-wider text-brand-neon uppercase">{g.region}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.cities.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/${locale}/karaoke/${c.slug}`}
                        className="group flex items-center justify-between rounded-2xl border border-brand-border bg-brand-surface px-5 py-4 transition hover:border-brand-neon/60"
                      >
                        <span>
                          <span className="block font-semibold text-white">{c.name}</span>
                          <span className="block text-xs text-brand-muted">{c.province}</span>
                        </span>
                        <span className="text-brand-muted transition group-hover:text-brand-neon">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-muted">{t("ctaText")}</p>
            <div className="mt-6">
              <Button href={`/${locale}/contacto`} size="lg">
                {t("ctaButton")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
