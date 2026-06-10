import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CookieSettingsLink } from "@/components/site/cookie-settings-link";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CookiesMeta" });
  return buildMetadata({
    locale,
    pathname: "/cookies",
    title: t("title"),
    description: t("description"),
  });
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Cookies");

  // Inventario de cookies del sitio. Los nombres son técnicos (no traducibles).
  const rows = [
    {
      name: "ak_cookie_consent",
      provider: t("providerOwn"),
      purpose: t("rowConsentPurpose"),
      duration: t("duration12m"),
      type: t("typeNecessary"),
    },
    {
      name: "authjs.session-token",
      provider: t("providerOwn"),
      purpose: t("rowSessionPurpose"),
      duration: t("durationSession"),
      type: t("typeNecessary"),
    },
    {
      name: "_ga, _ga_*",
      provider: "Google Analytics 4",
      purpose: t("rowGaPurpose"),
      duration: t("duration2y"),
      type: t("typeAnalytics"),
    },
    {
      name: "_fbp",
      provider: "Meta Pixel",
      purpose: t("rowFbPurpose"),
      duration: t("duration3m"),
      type: t("typeAnalytics"),
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("whatTitle")}</h2>
          <p className="mt-2 text-brand-muted">{t("whatText")}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("tableTitle")}</h2>
          <p className="mt-2 text-brand-muted">{t("tableIntro")}</p>
          {/* Tabla con scroll horizontal en móvil (mobile-first). */}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-brand-border bg-brand-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs tracking-wider text-white uppercase">
                  <th scope="col" className="px-4 py-3 font-semibold">{t("colName")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("colProvider")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("colPurpose")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("colDuration")}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t("colType")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-b border-brand-border/60 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs text-brand-neon">{r.name}</td>
                    <td className="px-4 py-3 text-brand-muted">{r.provider}</td>
                    <td className="px-4 py-3 text-brand-muted">{r.purpose}</td>
                    <td className="px-4 py-3 text-brand-muted">{r.duration}</td>
                    <td className="px-4 py-3 text-brand-muted">{r.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-brand-muted">{t("consentNote")}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("manageTitle")}</h2>
          <p className="mt-2 text-brand-muted">{t("manageText")}</p>
          <div className="mt-4">
            <CookieSettingsLink
              label={t("settingsButton")}
              className="inline-flex min-h-11 items-center rounded-full bg-brand-neon px-6 py-2.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
            />
          </div>
          <p className="mt-4 text-brand-muted">{t("browserText")}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">{t("moreTitle")}</h2>
          <p className="mt-2 text-brand-muted">
            {t("moreText")}{" "}
            <Link
              href={`/${locale}/privacidad`}
              className="text-brand-neon underline underline-offset-2 transition hover:text-brand-neon-strong"
            >
              {t("privacyLink")}
            </Link>
            .
          </p>
        </section>
      </Container>
    </section>
  );
}
