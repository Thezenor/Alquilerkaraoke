import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getContact } from "@/server/site-config";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const contact = await getContact();

  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      {/* Halos neón de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-neon/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-magenta/10 blur-3xl"
      />

      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-neon">
            {t("heroKicker")}
          </p>
          <h1 className="text-glow text-4xl font-bold leading-[1.1] text-white sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-brand-muted sm:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="#" size="lg" className="w-full sm:w-auto">
              {t("ctaQuote")}
            </Button>
            <Button
              href={contact.whatsappUrl}
              variant="secondary"
              size="lg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              {t("ctaWhatsapp")}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
