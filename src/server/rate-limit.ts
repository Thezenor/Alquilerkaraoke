// Rate-limit simple en memoria (por instancia). Suficiente para staging/antispam básico.
const hits = new Map<string, number[]>();

/** Devuelve true si se permite la acción; false si supera el límite. */
export function rateLimit(key: string, max = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  // Limpieza oportunista para no crecer sin límite.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

/** Detecta honeypot: si el campo trampa viene relleno, es un bot. */
export function isHoneypotFilled(formData: FormData, field = "website"): boolean {
  const v = formData.get(field);
  return typeof v === "string" && v.trim().length > 0;
}
