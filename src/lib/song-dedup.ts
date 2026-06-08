// Normalización para deduplicar canciones por Título + Intérprete.
// Quita acentos, pasa a minúsculas y colapsa todo lo no alfanumérico.

export function normalizeForKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Clave de deduplicación: agrupa la misma canción aunque cambie marca/acentos. */
export function dedupKey(title: string, performer: string): string {
  return `${normalizeForKey(title)}|${normalizeForKey(performer)}`;
}
