import "./globals.css";

/**
 * Root layout passthrough.
 * El <html>/<body> se define en los layouts hijos:
 *  - `[locale]/layout.tsx` para la web pública (idioma dinámico).
 *  - `admin/layout.tsx` para el panel (sin locale).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
