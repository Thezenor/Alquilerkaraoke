import { fontVariables } from "../fonts";

/** Layout para la firma pública de contratos (agnóstico de idioma, sin cabecera del sitio). */
export default function ContratoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-brand-bg">{children}</body>
    </html>
  );
}
