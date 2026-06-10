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
  const t = await getTranslations({ locale, namespace: "LegalNoticeMeta" });
  return buildMetadata({
    locale,
    pathname: "/aviso-legal",
    title: t("title"),
    description: t("description"),
  });
}

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("LegalNotice");
  const config = await getSiteConfig();

  // Identificación del prestador (LSSI art. 10) desde la configuración del admin.
  const ownerLines = [
    config?.legalName || config?.companyName || "Alquiler Karaoke",
    config?.taxId ? `CIF/NIF: ${config.taxId}` : `CIF/NIF: ${t("taxIdPending")}`,
    config?.address,
    config?.email ? `Email: ${config.email}` : null,
    `${t("phoneLabel")}: ${config?.phone ?? "607724965"}`,
    "Web: www.alquilerkaraoke.com",
  ].filter(Boolean) as string[];

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-brand-muted">{t("intro")}</p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("ownerTitle")}</h2>
          <ul className="mt-2 space-y-1 text-brand-muted">
            {ownerLines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <Section title={t("purposeTitle")} text={t("purposeText")} />
        <Section title={t("useTitle")} text={t("useText")} />
        <Section title={t("ipTitle")} text={t("ipText")} />
        <Section title={t("liabilityTitle")} text={t("liabilityText")} />
        <Section title={t("linksTitle")} text={t("linksText")} />
        <Section title={t("hostingTitle")} text={t("hostingText")} />
        <Section title={t("dataTitle")} text={t("dataText")} />
        <Section title={t("lawTitle")} text={t("lawText")} />
      </Container>
    </section>
  );
}
