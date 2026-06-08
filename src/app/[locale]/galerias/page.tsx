import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { getListedGalleries } from "@/server/galleries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GalleriesMeta" });
  return buildMetadata({ locale, pathname: "/galerias", title: t("title"), description: t("description") });
}

export default async function GalleriesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Galleries");
  const galleries = await getListedGalleries();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    url: absoluteUrl(`/${locale}/galerias`),
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-brand-muted">{t("intro")}</p>

          {galleries.length === 0 ? (
            <p className="mt-10 rounded-xl border border-dashed border-brand-border p-10 text-center text-brand-muted">
              {t("empty")}
            </p>
          ) : (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {galleries.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/${locale}/galerias/${g.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition hover:border-brand-neon/60"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-brand-surface-2">
                      {g.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- imagen remota
                        <img src={g.coverImageUrl} alt={g.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-muted">♪</div>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="font-semibold text-white">{g.title}</h2>
                      <p className="mt-1 text-sm text-brand-muted">
                        {t("photoCount", { count: g.itemCount })}
                        {g.locked ? ` · ${t("locked")}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
