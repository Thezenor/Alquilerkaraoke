import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, absoluteUrl } from "@/lib/seo";
import { getPublishedPostBySlug } from "@/server/blog";
import { Markdown, markdownToPlain } from "@/lib/markdown";
import { SmartImage } from "@/components/site/smart-image";

// ISR (patrón karaoke/[ciudad]): generación bajo demanda + caché de HTML estático.
// Los datos van cacheados por tag BLOG_TAG y el admin los invalida con updateTag.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    locale,
    pathname: `/blog/${slug}`,
    title: post.metaTitle || `${post.title} | Alquiler Karaoke`,
    description: post.metaDescription || post.excerpt || markdownToPlain(post.content),
    // La imagen OG la genera /blog/[slug]/opengraph-image (tarjeta de marca con el título).
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();
  setRequestLocale(locale);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt || markdownToPlain(post.content),
      ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
      ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
      dateModified: post.updatedAt.toISOString(),
      inLanguage: locale,
      mainEntityOfPage: absoluteUrl(`/${locale}/blog/${slug}`),
      author: { "@type": "Organization", name: "Alquiler Karaoke", url: absoluteUrl(`/${locale}`) },
      publisher: {
        "@type": "Organization",
        name: "Alquiler Karaoke",
        logo: { "@type": "ImageObject", url: absoluteUrl("/logo-badge.svg") },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Alquiler Karaoke", item: absoluteUrl(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl(`/${locale}/blog`) },
        { "@type": "ListItem", position: 3, name: post.title, item: absoluteUrl(`/${locale}/blog/${slug}`) },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <article className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Link href={`/${locale}/blog`} className="text-sm text-brand-muted transition hover:text-white">
            ← Blog
          </Link>

          {post.publishedAt && (
            <time className="mt-6 block text-sm text-brand-muted" dateTime={post.publishedAt.toISOString()}>
              {post.publishedAt.toLocaleDateString(locale)}
            </time>
          )}
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>

          {post.coverImageUrl && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-brand-border">
              <SmartImage
                src={post.coverImageUrl}
                alt={post.title}
                priority
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-8">
            <Markdown source={post.content} />
          </div>
        </Container>
      </article>
    </>
  );
}
