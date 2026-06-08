import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { fontVariables } from "../fonts";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsappFab } from "@/components/site/whatsapp-fab";
import { Analytics } from "@/components/site/analytics";
import { JsonLd } from "@/components/seo/json-ld";
import { getContact } from "@/server/site-config";
import { getActiveServices, localizedService } from "@/server/services";
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
  const config = await getContact();

  return {
    metadataBase: new URL(SITE_URL),
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      locale,
      ...(config.ogImageUrl ? { images: [config.ogImageUrl] } : {}),
    },
    ...(config.faviconUrl ? { icons: { icon: config.faviconUrl } } : {}),
    ...(config.gscVerification ? { verification: { google: config.gscVerification } } : {}),
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
  const services = (await getActiveServices()).map((s) => ({ slug: s.slug, name: localizedService(s, locale).name }));

  const nav = await getTranslations({ locale, namespace: "Nav" });
  const footer = await getTranslations({ locale, namespace: "Footer" });
  // Columna de servicios: los servicios activos + "todos" y packs.
  const servicesLinks = [
    ...services.map((s) => ({ href: `/${locale}/servicios/${s.slug}`, label: s.name })),
    { href: `/${locale}/packs`, label: nav("packs") },
  ];
  const infoLinks = [
    { href: `/${locale}/karaoke`, label: nav("cities") },
    { href: `/${locale}/galerias`, label: nav("galleries") },
    { href: `/${locale}/blog`, label: nav("blog") },
    { href: `/${locale}/faq`, label: (await getTranslations({ locale, namespace: "Faq" }))("title") },
    { href: `/${locale}/contacto`, label: nav("contact") },
    { href: `/${locale}/privacidad`, label: (await getTranslations({ locale, namespace: "Privacy" }))("title") },
    { href: `/${locale}/baja-marketing`, label: (await getTranslations({ locale, namespace: "Unsubscribe" }))("title") },
  ];

  // Color de marca configurable desde el admin (sobrescribe el token de tema).
  const themeStyle = contact.primaryColor
    ? ({ "--color-brand-neon": contact.primaryColor, "--color-brand-neon-strong": contact.primaryColor } as React.CSSProperties)
    : undefined;

  const sameAs = Object.values(contact.socials).filter((u): u is string => Boolean(u));
  const orgId = `${SITE_URL}/#organization`;
  const businessSchema = [
    {
      "@context": "https://schema.org",
      "@type": ["Organization", "LocalBusiness"],
      "@id": orgId,
      name: contact.companyName,
      url: absoluteUrl(`/${locale}`),
      telephone: `+34${contact.phone.replace(/\D/g, "")}`,
      ...(contact.email ? { email: contact.email } : {}),
      logo: absoluteUrl("/logo-badge.svg"),
      image: absoluteUrl("/opengraph-image"),
      areaServed: { "@type": "Country", name: "España" },
      priceRange: "€€",
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: absoluteUrl(`/${locale}`),
      name: contact.companyName,
      inLanguage: locale,
      publisher: { "@id": orgId },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${absoluteUrl(`/${locale}/canciones`)}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col" style={themeStyle}>
        <JsonLd data={businessSchema} />
        <NextIntlClientProvider>
          <SiteHeader services={services} logoUrl={contact.logoUrl} />
          <main className="flex flex-1 flex-col pt-16">{children}</main>
          <SiteFooter
            companyName={contact.companyName}
            logoUrl={contact.logoUrl}
            tagline={footer("tagline")}
            phone={contact.phone}
            phoneHref={contact.phoneHref}
            email={contact.email}
            whatsappUrl={contact.whatsappUrl}
            servicesTitle={footer("servicesTitle")}
            servicesLinks={servicesLinks}
            infoTitle={footer("infoTitle")}
            infoLinks={infoLinks}
            contactTitle={footer("contactTitle")}
            socials={contact.socials}
          />
          <WhatsappFab url={contact.whatsappUrl} />
        </NextIntlClientProvider>
        <Analytics gaMeasurementId={contact.gaMeasurementId} metaPixelId={contact.metaPixelId} />
      </body>
    </html>
  );
}
