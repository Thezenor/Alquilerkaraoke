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
  return buildMetadata({ locale, pathname: "/blog", title: t("title"), description: t("description") });
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
        <p className="mt-3 max-w-2xl text-brand-muted">{t("intro")}</p>

        {posts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-brand-border p-10 text-center text-brand-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition hover:border-brand-neon/50"
              >
                <Link href={`/${locale}/blog/${p.slug}`} className="flex flex-1 flex-col">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImageUrl} alt={p.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-surface-2 to-brand-bg" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {p.publishedAt && (
                      <time className="text-xs text-brand-muted" dateTime={p.publishedAt.toISOString()}>
                        {p.publishedAt.toLocaleDateString(locale)}
                      </time>
                    )}
                    <h2 className="mt-1 text-lg font-semibold text-white">{p.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-brand-muted">
                      {p.excerpt || markdownToPlain(p.content, 140)}
                    </p>
                    <span className="mt-3 text-sm font-medium text-brand-neon">{t("readMore")} →</span>
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
