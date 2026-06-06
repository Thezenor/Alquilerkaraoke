import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // ES, EN, FR (DECISIONS.md)
  locales: ["es", "en", "fr"],
  defaultLocale: "es",
  // Prefijo de idioma siempre visible: /es, /en, /fr (subrutas explícitas para SEO).
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
