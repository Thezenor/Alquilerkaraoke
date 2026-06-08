import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

type Faq = { q: string; a: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  return buildMetadata({ locale, pathname: "/faq", title: `${t("title")} | Alquiler Karaoke`, description: t("intro") });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Faq");
  const sp = await getTranslations("ServicesPage");
  const faq = sp.raw("faq") as Faq[];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-brand-muted">{t("intro")}</p>

          <dl className="mt-8 space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-brand-border bg-brand-surface p-5">
                <dt className="font-medium text-white">{f.q}</dt>
                <dd className="mt-1 text-sm text-brand-muted">{f.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 rounded-3xl border border-brand-border bg-gradient-to-br from-brand-surface-2 to-brand-surface p-8 text-center">
            <h2 className="text-xl font-bold text-white">{sp("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-muted">{sp("ctaText")}</p>
            <div className="mt-6">
              <Button href={`/${locale}/presupuesto`} size="lg">
                {sp("ctaTitle")}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
