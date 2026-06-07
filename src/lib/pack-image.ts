// Imagen de un pack: usa la foto subida (imageUrl) o, si no hay, un placeholder
// provisional por categoría. Y utilidades de presentación del contenido.

const CATEGORY_PLACEHOLDER: { match: RegExp; file: string }[] = [
  { match: /karaoke/i, file: "/packs/ph-karaoke.svg" },
  { match: /consola|gaming|vr/i, file: "/packs/ph-gaming.svg" },
  { match: /espuma/i, file: "/packs/ph-espuma.svg" },
  { match: /holi/i, file: "/packs/ph-holi.svg" },
  { match: /furor/i, file: "/packs/ph-furor.svg" },
];

const DEFAULT_PLACEHOLDER = "/packs/ph-default.svg";

/** Placeholder provisional según la categoría (o el nombre como respaldo). */
export function categoryPlaceholder(category?: string | null, name?: string | null): string {
  const haystack = `${category ?? ""} ${name ?? ""}`;
  for (const { match, file } of CATEGORY_PLACEHOLDER) {
    if (match.test(haystack)) return file;
  }
  return DEFAULT_PLACEHOLDER;
}

/** URL de imagen a mostrar: la subida o el placeholder provisional. */
export function packImage(pack: { imageUrl?: string | null; category?: string | null; name?: string | null }): string {
  return pack.imageUrl?.trim() || categoryPlaceholder(pack.category, pack.name);
}

/** ¿La imagen es un placeholder provisional (no una foto real subida)? */
export function isProvisionalImage(pack: { imageUrl?: string | null }): boolean {
  return !pack.imageUrl?.trim();
}

/** Convierte una descripción multilínea en una lista de "qué incluye". */
export function descriptionToFeatures(description?: string | null): string[] {
  if (!description) return [];
  return description
    .split("\n")
    .map((l) => l.replace(/^[\s•\-–*]+/, "").trim())
    .filter((l) => l.length > 0);
}
