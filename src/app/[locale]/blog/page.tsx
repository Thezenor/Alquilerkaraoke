import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { getPublishedPosts } from "@/server/blog";
import { markdownToPlain } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogMeta" });
  return buildMetadata({
    locale,
    pathname: "/blog",
    title: t("title"),
    description: t("description"),
  });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogPage");
  const posts = await getPublishedPosts(locale);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="text-brand-muted mt-3 max-w-2xl">{t("intro")}</p>

        {posts.length === 0 ? (
          <p className="border-brand-border text-brand-muted mt-10 rounded-xl border border-dashed p-10 text-center">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className="card-lift border-brand-border bg-brand-surface hover:border-brand-neon/50 flex flex-col overflow-hidden rounded-2xl border"
              >
                <Link href={`/${locale}/blog/${p.slug}`} className="flex flex-1 flex-col">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="from-brand-surface-2 to-brand-bg aspect-[16/9] w-full bg-gradient-to-br" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {p.publishedAt && (
                      <time
                        className="text-brand-muted text-xs"
                        dateTime={p.publishedAt.toISOString()}
                      >
                        {p.publishedAt.toLocaleDateString(locale)}
                      </time>
                    )}
                    <h2 className="mt-1 text-lg font-semibold text-white">{p.title}</h2>
                    <p className="text-brand-muted mt-2 line-clamp-3 flex-1 text-sm">
                      {p.excerpt || markdownToPlain(p.content, 140)}
                    </p>
                    <span className="text-brand-neon mt-3 text-sm font-medium">
                      {t("readMore")} →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
