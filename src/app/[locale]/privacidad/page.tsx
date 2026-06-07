import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo";
import { getSiteConfig } from "@/server/site-config";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-brand-muted">{text}</p>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyMeta" });
  return buildMetadata({
    locale,
    pathname: "/privacidad",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Privacy");
  const config = await getSiteConfig();

  const controllerLines = [
    config?.companyName,
    config?.legalName,
    config?.taxId ? `CIF/NIF: ${config.taxId}` : null,
    config?.address,
    config?.email,
  ].filter(Boolean) as string[];

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>

        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          {t("draftNotice")}
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("controllerTitle")}</h2>
          <ul className="mt-2 text-brand-muted">
            {controllerLines.length > 0 ? (
              controllerLines.map((l) => <li key={l}>{l}</li>)
            ) : (
              <li>Alquiler Karaoke</li>
            )}
          </ul>
        </section>

        <Section title={t("purposeTitle")} text={t("purposeText")} />
        <Section title={t("legalBasisTitle")} text={t("legalBasisText")} />
        <Section title={t("marketingTitle")} text={t("marketingText")} />
        <Section title={t("rightsTitle")} text={t("rightsText")} />
        <Section title={t("retentionTitle")} text={t("retentionText")} />
      </Container>
    </section>
  );
}
