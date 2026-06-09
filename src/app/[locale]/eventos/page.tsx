import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { getActiveEventTypes, localizedEventType } from "@/server/event-types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventsMeta" });
  return buildMetadata({ locale, pathname: "/eventos", title: t("title"), description: t("description") });
}

export default async function EventsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Events");
  const events = await getActiveEventTypes();

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t("title"),
      url: absoluteUrl(`/${locale}/eventos`),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: events.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: localizedEventType(e, locale).name,
        url: absoluteUrl(`/${locale}/eventos/${e.slug}`),
      })),
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{t("intro")}</p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const l = localizedEventType(e, locale);
              return (
                <li key={e.id}>
                  <Link
                    href={`/${locale}/eventos/${e.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition hover:border-brand-neon/60"
                  >
                    {e.heroImageUrl && (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-brand-surface-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota */}
                        <img src={e.heroImageUrl} alt={l.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-semibold text-white">{l.name}</h2>
                      <p className="mt-1 text-sm text-brand-muted">{l.shortDescription}</p>
                      <span className="mt-3 text-sm text-brand-neon">{t("seeMore")} →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </>
  );
}
