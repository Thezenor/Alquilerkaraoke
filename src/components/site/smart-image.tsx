import Image from "next/image";
import { cn } from "@/lib/cn";

// Imagen pública optimizada con next/image en modo `fill`.
// El contenedor padre debe ser `relative` y definir el alto (p. ej. aspect-*).
//
// - Rutas locales (/media/… del Volume o /packs/… de public): pasan por el
//   optimizador de Next (AVIF/WebP + srcset por tamaño → menos bytes en móvil).
// - SVG: se sirve tal cual (el optimizador no rasteriza SVG).
// - URLs externas (http/https): <img> normal. El admin permite pegar cualquier
//   URL y el optimizador exige remotePatterns por host, así que no se optimizan.
type Props = {
  src: string;
  alt: string;
  /** Tamaños reales por breakpoint (atributo `sizes`), obligatorio para no descargar de más. */
  sizes: string;
  /** true para la imagen LCP (heros): precarga y sin lazy. */
  priority?: boolean;
  className?: string;
};

export function SmartImage({ src, alt, sizes, priority = false, className }: Props) {
  if (/^https?:\/\//i.test(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- origen externo no optimizable
      <img
        src={src}
        alt={alt}
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
        className={cn("absolute inset-0 h-full w-full", className)}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith(".svg")}
      className={className}
    />
  );
}
