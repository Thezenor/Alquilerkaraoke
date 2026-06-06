import { fontVariables } from "../fonts";

/**
 * Layout del panel de administración: define su propio <html>/<body>.
 * El panel es agnóstico de idioma (sin prefijo de locale).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
