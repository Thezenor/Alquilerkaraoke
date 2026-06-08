import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { searchSongs, getLanguageCounts } from "@/server/songs";
import { languageName } from "@/lib/song-languages";
import { LanguageFlag } from "@/components/language-flag";
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
  searchParams: Promise<{ q?: string; lang?: string; page?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Songs");

  const q = (sp.q ?? "").trim();
  const rawLang = (sp.lang ?? "").trim();
  const langParam = rawLang.toUpperCase();
  const sort: "title" | "performer" = sp.sort === "performer" ? "performer" : "title";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const OTHER = "_OTHER";
  const THRESHOLD = 10;
  // Parámetros a conservar al cambiar de filtro/orden/página.
  const keep: Record<string, string> = { ...(q ? { q } : {}), ...(sort !== "title" ? { sort } : {}) };

  const [unique, langCounts] = await Promise.all([uniqueCount(), getLanguageCounts()]);
  // Idiomas con ≥10 canciones (ya ordenados de más a menos); el resto + "Ninguno"
  // se agrupan en "Sin clasificar", que va siempre al final.
  const major = langCounts.filter((c) => c.code !== "NI" && c.count >= THRESHOLD);
  const minor = langCounts.filter((c) => c.code === "NI" || c.count < THRESHOLD);
  const minorCodes = minor.map((c) => c.code);
  const minorTotal = minor.reduce((s, c) => s + c.count, 0);
  const isOther = langParam === OTHER;
  const lang = isOther ? "" : langParam;

  const result = await searchSongs({
    q,
    sort,
    page,
    pageSize: 40,
    ...(isOther ? { langIn: minorCodes.length ? minorCodes : ["__none__"] } : { lang: lang || undefined }),
  });
  const stats = { unique };
  const loc: "es" | "en" = locale === "en" ? "en" : "es";

  const makeHref = (p: number) => {
    const u = new URLSearchParams({ ...keep, ...(rawLang ? { lang: rawLang } : {}) });
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return qs ? `/${locale}/canciones?${qs}` : `/${locale}/canciones`;
  };
  // Enlace conservando filtro y búsqueda, cambiando el orden.
  const sortHref = (s: "title" | "performer") => {
    const u = new URLSearchParams({ ...(q ? { q } : {}), ...(rawLang ? { lang: rawLang } : {}), ...(s !== "title" ? { sort: s } : {}) });
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
              {rawLang && <input type="hidden" name="lang" value={rawLang} />}
              {sort !== "title" && <input type="hidden" name="sort" value={sort} />}
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
                href={`/${locale}/canciones${new URLSearchParams(keep).toString() ? `?${new URLSearchParams(keep).toString()}` : ""}`}
                className={cn(
                  "flex w-24 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition",
                  !langParam ? "border-brand-neon bg-brand-neon/10" : "border-brand-border bg-brand-surface hover:border-brand-neon/50",
                )}
              >
                <span className="text-2xl leading-none">🌐</span>
                <span className="text-xs font-medium text-white">{t("allLanguages")}</span>
                <span className="text-sm font-bold text-brand-neon">{stats.unique.toLocaleString("es-ES")}</span>
              </Link>
              {major.map((l) => {
                const active = langParam === l.code;
                const params = new URLSearchParams({ lang: l.code, ...keep });
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
                    <LanguageFlag code={l.code} />
                    <span className="line-clamp-1 text-xs font-medium text-white">{languageName(l.code, loc)}</span>
                    <span className="text-sm font-bold text-brand-neon">{l.count.toLocaleString("es-ES")}</span>
                  </Link>
                );
              })}
              {minorTotal > 0 && (
                <Link
                  href={`/${locale}/canciones?${new URLSearchParams({ lang: "_other", ...keep }).toString()}`}
                  className={cn(
                    "flex w-24 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition",
                    isOther ? "border-brand-neon bg-brand-neon/10" : "border-brand-border bg-brand-surface hover:border-brand-neon/50",
                  )}
                >
                  <span className="text-2xl leading-none">🌐</span>
                  <span className="line-clamp-1 text-xs font-medium text-white">{t("unclassified")}</span>
                  <span className="text-sm font-bold text-brand-neon">{minorTotal.toLocaleString("es-ES")}</span>
                </Link>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-brand-muted">{t("results", { count: result.total })}</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Ordenar por título / intérprete */}
                <div className="inline-flex items-center gap-1 rounded-lg border border-brand-border p-0.5 text-sm">
                  <span className="px-2 text-xs text-brand-muted">{t("sortBy")}:</span>
                  <Link
                    href={sortHref("title")}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition",
                      sort === "title" ? "bg-brand-neon font-medium text-brand-bg" : "text-brand-muted hover:text-white",
                    )}
                  >
                    {t("colTitle")}
                  </Link>
                  <Link
                    href={sortHref("performer")}
                    className={cn(
                      "rounded-md px-2.5 py-1 transition",
                      sort === "performer" ? "bg-brand-neon font-medium text-brand-bg" : "text-brand-muted hover:text-white",
                    )}
                  >
                    {t("performer")}
                  </Link>
                </div>
                {result.total > 0 && !isOther && (
                  <a
                    href={`/${locale}/canciones/pdf?${new URLSearchParams({ ...(lang ? { lang } : {}), ...keep }).toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-neon/60"
                  >
                    ↓ {t("downloadPdf")}
                  </a>
                )}
              </div>
            </div>

            {result.items.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-brand-border p-8 text-center text-brand-muted">
                {t("empty")}
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
                {/* Cabecera tipo tabla (desktop) */}
                <div className="hidden grid-cols-[2.5rem_1fr_1fr_7rem] gap-4 border-b border-brand-border bg-brand-surface-2/50 px-4 py-2.5 text-xs font-semibold tracking-wide text-brand-muted uppercase sm:grid">
                  <span className="text-center">#</span>
                  <span>{t("colTitle")}</span>
                  <span>{t("performer")}</span>
                  <span className="text-right">{t("language")}</span>
                </div>
                <ul className="divide-y divide-brand-border/70">
                {result.items.map((s, i) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr_5rem] items-start gap-x-4 gap-y-0.5 px-4 py-3 transition hover:bg-brand-surface-2/40 sm:grid-cols-[2.5rem_1fr_1fr_7rem]"
                  >
                    <span className="hidden pt-0.5 text-center text-xs tabular-nums text-brand-muted/60 sm:block">
                      {(page - 1) * 40 + i + 1}
                    </span>
                    <p className="line-clamp-2 min-w-0 font-medium break-words text-white">{s.title}</p>
                    <p className="line-clamp-2 min-w-0 text-sm break-words text-brand-muted">{s.performer}</p>
                    <span className="flex items-center justify-end gap-1.5 pt-0.5 sm:justify-end">
                      <LanguageFlag code={s.languageCode} className="text-base leading-none" />
                      <span className="hidden text-xs text-brand-muted lg:inline">{languageName(s.languageCode, loc)}</span>
                    </span>
                  </li>
                ))}
                </ul>
              </div>
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
