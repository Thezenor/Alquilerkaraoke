import { notFound } from "next/navigation";

/**
 * Catch-all dentro de [locale]: cualquier ruta que no exista (ej. /es/foo-bar)
 * dispara el 404 de marca de `[locale]/not-found.tsx` con el layout público.
 * Sin esto, las URLs no resueltas caerían en el 404 raíz sin diseño.
 */
export default function CatchAllNotFoundPage() {
  notFound();
}
