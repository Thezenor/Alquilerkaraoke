"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

export type HeaderService = { slug: string; name: string };

// Rutas internas localizadas (el Link i18n añade el prefijo de idioma).
const NAV_ITEMS = [
  { key: "services", href: "/servicios" },
  { key: "packs", href: "/packs" },
  { key: "songs", href: "/canciones" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contacto" },
] as const;

export function SiteHeader({ services = [], logoUrl }: { services?: HeaderService[]; logoUrl?: string | null }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const quoteHref = `/${locale}/presupuesto`;
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border/60 bg-brand-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Alquiler Karaoke">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG estático, sin optimización necesaria */}
          <img src={logoUrl || "/logo.svg"} alt="Alquiler Karaoke" className="h-9 w-auto sm:h-10" width={120} height={41} />
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) =>
            item.key === "services" && services.length > 0 ? (
              <div key={item.key} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm text-brand-muted transition hover:text-white"
                >
                  {t(item.key)}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <div className="invisible absolute left-0 top-full z-10 w-56 translate-y-1 rounded-xl border border-brand-border bg-brand-surface p-2 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {services.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/servicios/${s.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-brand-muted transition hover:bg-brand-surface-2 hover:text-white"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className="text-sm text-brand-muted transition hover:text-white"
              >
                {t(item.key)}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <NextLink
            href="/admin/login"
            className="hidden text-sm text-brand-muted transition hover:text-white md:inline"
          >
            {t("access")}
          </NextLink>
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>
          <Button href={quoteHref} size="md" className="hidden sm:inline-flex">
            {t("quote")}
          </Button>

          {/* Botón menú móvil */}
          <button
            type="button"
            aria-label={t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span className={cn("absolute left-0 top-0 h-0.5 w-full bg-current transition", open && "translate-y-[7px] rotate-45")} />
              <span className={cn("absolute left-0 top-[7px] h-0.5 w-full bg-current transition", open && "opacity-0")} />
              <span className={cn("absolute bottom-0 left-0 h-0.5 w-full bg-current transition", open && "-translate-y-[7px] -rotate-45")} />
            </span>
          </button>
        </div>
      </Container>

      {/* Panel móvil desplegable */}
      {open && (
        <div className="border-t border-brand-border/60 bg-brand-surface md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => (
              <div key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-brand-text transition hover:bg-brand-surface-2"
                >
                  {t(item.key)}
                </Link>
                {item.key === "services" && services.length > 0 && (
                  <div className="ml-3 flex flex-col border-l border-brand-border pl-2">
                    {services.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/servicios/${s.slug}`}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-brand-muted transition hover:bg-brand-surface-2 hover:text-white"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <NextLink
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-brand-muted transition hover:bg-brand-surface-2 hover:text-white"
            >
              {t("access")}
            </NextLink>
            <div className="mt-3 flex items-center justify-between gap-3">
              <LocaleSwitcher />
              <Button href={quoteHref} size="md" className="flex-1">
                {t("quote")}
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
