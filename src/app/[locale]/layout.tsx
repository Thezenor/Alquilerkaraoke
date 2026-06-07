import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { fontVariables } from "../fonts";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsappFab } from "@/components/site/whatsapp-fab";
import { JsonLd } from "@/components/seo/json-ld";
import { getContact } from "@/server/site-config";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Metadata base común. El canonical/hreflang y el título por página los define
// cada page con `buildMetadata` (src/lib/seo.ts).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: { siteName: SITE_NAME, type: "website", locale },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Habilita el renderizado estático con next-intl.
  setRequestLocale(locale);

  const contact = await getContact();

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: contact.companyName,
    url: absoluteUrl(`/${locale}`),
    telephone: `+34${contact.phone.replace(/\D/g, "")}`,
    image: absoluteUrl("/opengraph-image"),
    areaServed: "ES",
    priceRange: "€€",
  };

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <JsonLd data={businessSchema} />
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col pt-16">{children}</main>
          <SiteFooter
            companyName={contact.companyName}
            phone={contact.phone}
            phoneHref={contact.phoneHref}
            privacyHref={`/${locale}/privacidad`}
            privacyLabel={(await getTranslations({ locale, namespace: "Privacy" }))("title")}
            unsubscribeHref={`/${locale}/baja-marketing`}
            unsubscribeLabel={(await getTranslations({ locale, namespace: "Unsubscribe" }))("title")}
          />
          <WhatsappFab url={contact.whatsappUrl} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
