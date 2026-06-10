"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

/** Icono de teléfono (CTA de llamada en header y panel móvil). */
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export type HeaderService = { slug: string; name: string };

// Rutas internas localizadas (el Link i18n añade el prefijo de idioma).
const NAV_ITEMS = [
  { key: "services", href: "/servicios" },
  { key: "events", href: "/eventos" },
  { key: "packs", href: "/packs" },
  { key: "songs", href: "/canciones" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contacto" },
] as const;

export function SiteHeader({
  services = [],
  events = [],
  logoUrl,
  phone,
  phoneHref,
}: {
  services?: HeaderService[];
  events?: HeaderService[];
  logoUrl?: string | null;
  phone?: string;
  phoneHref?: string;
}) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const quoteHref = `/${locale}/presupuesto`;
  const [open, setOpen] = useState(false);
  // Ítems del menú con desplegable (subpáginas dinámicas desde BD).
  const dropdowns: Record<string, HeaderService[]> = { services, events };

  // Bloquea el scroll del body mientras el panel móvil está abierto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="border-brand-border/60 bg-brand-bg/80 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Alquiler Karaoke">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo SVG estático, sin optimización necesaria */}
          <img
            src={logoUrl || "/logo.svg"}
            alt="Alquiler Karaoke"
            className="h-9 w-auto sm:h-10"
            width={120}
            height={41}
          />
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => {
            const sub = dropdowns[item.key];
            return sub && sub.length > 0 ? (
              <div key={item.key} className="group relative">
                <Link
                  href={item.href}
                  className="text-brand-muted flex items-center gap-1 text-sm transition hover:text-white"
                >
                  {t(item.key)}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <div className="border-brand-border bg-brand-surface invisible absolute top-full left-0 z-10 w-56 translate-y-1 rounded-xl border p-2 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {sub.map((s) => (
                    <Link
                      key={s.slug}
                      href={`${item.href}/${s.slug}`}
                      className="text-brand-muted hover:bg-brand-surface-2 block rounded-lg px-3 py-2 text-sm transition hover:text-white"
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
                className="text-brand-muted text-sm transition hover:text-white"
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {phone && phoneHref && (
            <a
              href={phoneHref}
              className="text-brand-text hover:text-brand-neon hidden items-center gap-1.5 text-sm font-medium transition md:inline-flex"
            >
              <PhoneIcon className="text-brand-neon h-4 w-4" />
              {phone}
            </a>
          )}
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
            className="border-brand-border text-brand-text inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute top-0 left-0 h-0.5 w-full bg-current transition",
                  open && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute top-[7px] left-0 h-0.5 w-full bg-current transition",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 w-full bg-current transition",
                  open && "-translate-y-[7px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </Container>

      {/* Panel móvil desplegable (animación de entrada respetando reduced-motion) */}
      {open && (
        <div className="border-brand-border/60 bg-brand-surface motion-safe:animate-menu-in max-h-[calc(100dvh-4rem)] overflow-y-auto border-t md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => {
              const sub = dropdowns[item.key];
              return (
                <div key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-brand-text hover:bg-brand-surface-2 block rounded-lg px-3 py-2.5 transition"
                  >
                    {t(item.key)}
                  </Link>
                  {sub && sub.length > 0 && (
                    <div className="border-brand-border ml-3 flex flex-col border-l pl-2">
                      {sub.map((s) => (
                        <Link
                          key={s.slug}
                          href={`${item.href}/${s.slug}`}
                          onClick={() => setOpen(false)}
                          className="text-brand-muted hover:bg-brand-surface-2 rounded-lg px-3 py-2 text-sm transition hover:text-white"
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {phone && phoneHref && (
              <a
                href={phoneHref}
                onClick={() => setOpen(false)}
                className="text-brand-text hover:bg-brand-surface-2 flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium transition"
              >
                <PhoneIcon className="text-brand-neon h-4.5 w-4.5" />
                {phone}
              </a>
            )}
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
