import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata, pageTitle } from "@/lib/seo";
import {
  getGalleryBySlug,
  getGalleryItems,
  isExpired,
  galleryCookieName,
  verifyGalleryToken,
} from "@/server/galleries";
import { SmartImage } from "@/components/site/smart-image";
import { UnlockForm } from "../unlock-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) return {};
  // Las galerías protegidas o no listadas no se indexan.
  const noindex = gallery.passwordHash != null || !gallery.isListed;
  return buildMetadata({
    locale,
    pathname: `/galerias/${slug}`,
    title: pageTitle(gallery.title),
    description: gallery.description ?? gallery.title,
    noindex,
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  if (!gallery) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("Gallery");

  const expired = isExpired(gallery);
  const locked = gallery.passwordHash != null;
  let unlocked = !locked;
  if (locked) {
    const jar = await cookies();
    unlocked = verifyGalleryToken(gallery.id, jar.get(galleryCookieName(gallery.id))?.value);
  }
  // Los elementos solo se cargan si de verdad se van a mostrar.
  const items = !expired && unlocked ? await getGalleryItems(gallery.id) : [];

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <nav className="mb-6 text-sm text-brand-muted" aria-label="Breadcrumb">
          <Link href={`/${locale}/galerias`} className="transition hover:text-brand-neon">
            {t("breadcrumb")}
          </Link>
          <span className="mx-2 text-brand-muted/50">/</span>
          <span className="text-white">{gallery.title}</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">{gallery.title}</h1>
        {gallery.description && <p className="mt-3 max-w-2xl text-brand-muted">{gallery.description}</p>}

        {expired ? (
          <p className="mt-10 rounded-xl border border-dashed border-brand-border p-10 text-center text-brand-muted">
            {t("expired")}
          </p>
        ) : !unlocked ? (
          <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-8 text-center">
            <p className="text-4xl">🔒</p>
            <UnlockForm
              locale={locale}
              slug={slug}
              labels={{ prompt: t("unlockPrompt"), placeholder: t("unlockPlaceholder"), button: t("unlockButton") }}
            />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-brand-border p-10 text-center text-brand-muted">
            {t("empty")}
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <li key={it.id} className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface-2">
                {it.type === "VIDEO" ? (
                  <video
                    src={it.url}
                    controls
                    preload="none"
                    poster={it.thumbnailUrl ?? undefined}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="relative aspect-square w-full">
                    <SmartImage
                      src={it.thumbnailUrl ?? it.url}
                      alt={it.caption ?? gallery.title}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                )}
                {gallery.allowDownload && it.type === "IMAGE" && (
                  <a
                    href={it.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 bottom-2 rounded-full bg-brand-bg/80 px-3 py-1 text-xs text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
                  >
                    ↓ {t("download")}
                  </a>
                )}
                {it.caption && (
                  <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-xs text-white">
                    {it.caption}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
