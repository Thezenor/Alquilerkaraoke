import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getContact } from "@/server/site-config";

/**
 * 404 de marca dentro del segmento [locale]: lo disparan tanto las fichas que
 * llaman a notFound() (packs, servicios, ciudades, blog…) como las rutas
 * inexistentes capturadas por `[locale]/[...rest]/page.tsx`.
 * Se renderiza dentro del layout público (header, footer, CTA móvil).
 */
export default async function LocaleNotFound() {
  // En not-found no hay params: el locale viene del contexto de la request
  // (setRequestLocale en [locale]/layout.tsx).
  const locale = await getLocale();
  const [t, contact] = await Promise.all([
    getTranslations({ locale, namespace: "NotFound" }),
    getContact(),
  ]);

  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      {/* Glows de marca (mismo lenguaje visual que la home) */}
      <div
        aria-hidden
        className="bg-brand-neon/15 pointer-events-none absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-brand-magenta/10 pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full blur-3xl"
      />

      <Container className="relative py-20 text-center sm:py-28">
        <p className="text-brand-neon text-xs font-semibold tracking-[0.25em] uppercase">
          {t("kicker")}
        </p>
        <p aria-hidden className="text-gradient-brand mt-4 text-7xl font-bold sm:text-9xl">
          404
        </p>
        <h1 className="text-glow mx-auto mt-4 max-w-xl text-2xl font-bold text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-brand-muted">{t("description")}</p>

        {/* CTAs: columna en móvil, fila en escritorio */}
        <div className="mx-auto mt-10 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button href={`/${locale}`} size="lg">
            {t("ctaHome")}
          </Button>
          <Button href={`/${locale}/packs`} variant="secondary" size="lg">
            {t("ctaPacks")}
          </Button>
          <Button href={`/${locale}/presupuesto`} variant="secondary" size="lg">
            {t("ctaQuote")}
          </Button>
        </div>
        <a
          href={contact.phoneHref}
          className="mt-6 inline-block text-sm font-medium text-brand-muted transition hover:text-brand-neon"
        >
          {t("ctaCall", { phone: contact.phone })}
        </a>
      </Container>
    </section>
  );
}
