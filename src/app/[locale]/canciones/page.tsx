import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { searchSongs, getLanguageCounts } from "@/server/songs";
import { languageName, flagFor } from "@/lib/song-languages";
import { cn } from "@/lib/cn";

async function uniqueCount(): Promise<number> {
  try {
    return await prisma.song.count({ where: { isPrimary: true } });
  } catch {
    return 0;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SongsMeta" });
  return buildMetadata({ locale, pathname: "/canciones", title: t("title"), description: t("description") });
}

export default async function SongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; lang?: string; page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Songs");

  const q = (sp.q ?? "").trim();
  const lang = (sp.lang ?? "").trim().toUpperCase();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [unique, langCounts, result] = await Promise.all([
    uniqueCount(),
    getLanguageCounts(),
    searchSongs({ q, lang: lang || undefined, page, pageSize: 40 }),
  ]);
  const stats = { unique };
  const loc: "es" | "en" = locale === "en" ? "en" : "es";

  const makeHref = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (lang) u.set("lang", lang);
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return qs ? `/${locale}/canciones?${qs}` : `/${locale}/canciones`;
  };

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-brand-muted">{t("intro")}</p>
        {stats.unique > 0 && (
          <p className="mt-2 text-sm font-medium text-brand-neon">{t("total", { count: stats.unique })}</p>
        )}

        {stats.unique === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-brand-border p-10 text-center text-brand-muted">
            {t("emptyCatalog")}
          </p>
        ) : (
          <>
            {/* Buscador (GET, sin JS) — conserva el idioma activo */}
            <form method="get" action={`/${locale}/canciones`} className="mt-8 flex flex-col gap-3 sm:flex-row">
              {lang && <input type="hidden" name="lang" value={lang} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="flex-1 rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-white placeholder:text-brand-muted/60 focus:border-brand-neon focus:outline-none"
              />
              <button type="submit" className="rounded-lg bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
                {t("search")}
              </button>
            </form>

            {/* Filtro por idioma con banderas */}
            <h2 className="mt-8 text-sm font-semibold tracking-wide text-brand-muted uppercase">{t("byLanguage")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={q ? `/${locale}/canciones?q=${encodeURIComponent(q)}` : `/${locale}/canciones`}
                className={cn(
                  "flex w-24 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition",
                  !lang ? "border-brand-neon bg-brand-neon/10" : "border-brand-border bg-brand-surface hover:border-brand-neon/50",
                )}
              >
                <span className="text-2xl">🌐</span>
                <span className="text-xs font-medium text-white">{t("allLanguages")}</span>
                <span className="text-sm font-bold text-brand-neon">{stats.unique.toLocaleString("es-ES")}</span>
              </Link>
              {langCounts.map((l) => {
                const active = lang === l.code;
                const params = new URLSearchParams({ lang: l.code, ...(q ? { q } : {}) });
                return (
                  <Link
                    key={l.code}
                    href={`/${locale}/canciones?${params.toString()}`}
                    title={languageName(l.code, loc)}
                    className={cn(
                      "flex w-24 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition",
                      active ? "border-brand-neon bg-brand-neon/10" : "border-brand-border bg-brand-surface hover:border-brand-neon/50",
                    )}
                  >
                    <span className="text-2xl leading-none">{flagFor(l.code)}</span>
                    <span className="line-clamp-1 text-xs font-medium text-white">{languageName(l.code, loc)}</span>
                    <span className="text-sm font-bold text-brand-neon">{l.count.toLocaleString("es-ES")}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-brand-muted">{t("results", { count: result.total })}</p>
              {result.total > 0 && (
                <a
                  href={`/${locale}/canciones/pdf?${new URLSearchParams({ ...(lang ? { lang } : {}), ...(q ? { q } : {}) }).toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-neon/60"
                >
                  ↓ {t("downloadPdf")}
                </a>
              )}
            </div>

            {result.items.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-brand-border p-8 text-center text-brand-muted">
                {t("empty")}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
                {result.items.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{s.title}</p>
                      <p className="truncate text-sm text-brand-muted">{s.performer}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-surface-2 px-2.5 py-0.5 text-xs text-brand-muted">
                      {languageName(s.languageCode, loc)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {result.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-between gap-2" aria-label="Paginación">
                {page > 1 ? (
                  <Link href={makeHref(page - 1)} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-brand-neon hover:text-brand-neon">
                    ← {page - 1}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-brand-muted">{page} / {result.totalPages}</span>
                {page < result.totalPages ? (
                  <Link href={makeHref(page + 1)} className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-muted transition hover:border-brand-neon hover:text-brand-neon">
                    {page + 1} →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
