import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { getSiteConfig } from "@/server/site-config";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-brand-muted">{text}</p>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsMeta" });
  return buildMetadata({
    locale,
    pathname: "/terminos",
    title: t("title"),
    description: t("description"),
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Terms");
  const config = await getSiteConfig();
  const company = config?.legalName || config?.companyName || "Alquiler Karaoke";

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-brand-muted">{t("intro", { company })}</p>

        <Section title={t("scopeTitle")} text={t("scopeText")} />
        <Section title={t("quoteTitle")} text={t("quoteText")} />
        <Section title={t("bookingTitle")} text={t("bookingText")} />
        <Section title={t("paymentTitle")} text={t("paymentText")} />
        <Section title={t("securityDepositTitle")} text={t("securityDepositText")} />
        <Section title={t("cancellationTitle")} text={t("cancellationText")} />
        <Section title={t("clientTitle")} text={t("clientText")} />
        <Section title={t("providerTitle")} text={t("providerText")} />
        <Section title={t("liabilityTitle")} text={t("liabilityText")} />
        <Section title={t("lawTitle")} text={t("lawText")} />
      </Container>
    </section>
  );
}
