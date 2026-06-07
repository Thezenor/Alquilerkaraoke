"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

const NAV_KEYS = ["services", "packs", "songs", "contact"] as const;

export function SiteHeader() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const contactHref = `/${locale}/contacto`;
  const quoteHref = `/${locale}/presupuesto`;
  const [open, setOpen] = useState(false);

  const hrefByKey: Record<string, string> = {
    services: `/${locale}/servicios`,
    packs: `/${locale}/packs`,
    contact: contactHref,
  };
  const navItems = NAV_KEYS.map((key) => ({
    key,
    href: hrefByKey[key] ?? "#",
  }));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border/60 bg-brand-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          Alquiler Karaoke
        </Link>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-brand-muted transition hover:text-white"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>
          <Button href={quoteHref} size="md" className="hidden sm:inline-flex">
            {t("quote")}
          </Button>

          {/* Botón menú móvil */}
          <button
            type="button"
            aria-label="Menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-0.5 w-full bg-current transition",
                  open && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] h-0.5 w-full bg-current transition",
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

      {/* Panel móvil desplegable */}
      {open && (
        <div className="border-t border-brand-border/60 bg-brand-surface md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-brand-text transition hover:bg-brand-surface-2"
              >
                {t(item.key)}
              </a>
            ))}
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
