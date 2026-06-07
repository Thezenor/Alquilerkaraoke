import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { UnsubscribeForm } from "./unsubscribe-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Unsubscribe" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Unsubscribe");

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-brand-muted">{t("intro")}</p>

        <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8">
          <UnsubscribeForm />
        </div>

        <p className="mt-6 text-sm text-brand-muted">{t("note")}</p>
      </Container>
    </section>
  );
}
