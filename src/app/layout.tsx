import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

// metadataBase global para resolver URLs de OG/Twitter en todas las rutas.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

/**
 * Root layout passthrough.
 * El <html>/<body> se define en los layouts hijos:
 *  - `[locale]/layout.tsx` para la web pública (idioma dinámico).
 *  - `admin/layout.tsx` para el panel (sin locale).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
