import Link from "next/link";
import "./globals.css";

/**
 * 404 raíz (fuera de [locale]): se dispara p. ej. con un prefijo de idioma no
 * soportado (/de/...). El root layout es passthrough, así que aquí se definen
 * <html>/<body>. Mínimo, en ES (idioma por defecto) y con diseño de marca.
 */
export default function RootNotFound() {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-brand-bg px-6 py-20 text-center text-brand-text">
        <p className="text-brand-neon text-xs font-semibold tracking-[0.25em] uppercase">
          Error 404
        </p>
        <p aria-hidden className="text-gradient-brand mt-4 text-7xl font-bold sm:text-9xl">
          404
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-bold text-white sm:text-4xl">
          Esta página no existe
        </h1>
        <p className="mt-4 max-w-md text-brand-muted">
          La dirección que buscas no existe o ha cambiado.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/es"
            className="inline-flex items-center justify-center rounded-full bg-brand-neon px-7 py-3.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
          >
            Ir a la portada
          </Link>
          <Link
            href="/es/presupuesto"
            className="inline-flex items-center justify-center rounded-full border border-brand-border px-7 py-3.5 font-semibold text-brand-text transition hover:border-brand-neon/60 hover:text-white"
          >
            Pedir presupuesto
          </Link>
        </div>
      </body>
    </html>
  );
}
