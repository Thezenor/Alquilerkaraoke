import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { getContact } from "@/server/site-config";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "./contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactMeta" });
  return buildMetadata({
    locale,
    pathname: "/contacto",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Contact");
  const contact = await getContact();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-brand-muted">{t("subtitle")}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8">
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="font-semibold text-white">{t("whatsappTitle")}</h2>
              <p className="mt-1 text-sm text-brand-muted">{t("whatsappText")}</p>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-semibold text-white transition hover:brightness-110"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.14 1.02-2.43.27-.29.59-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.03.89 2.18.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.16-.29.37-.41.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.6.76 1.87.9.27.13.45.2.51.31.07.11.07.66-.17 1.34Z" />
                </svg>
                {t("whatsappCta")}
              </a>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="text-sm tracking-wide text-brand-muted uppercase">{t("phoneLabel")}</h2>
              <a href={contact.phoneHref} className="mt-1 block text-lg font-semibold text-white">
                {contact.phone}
              </a>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
