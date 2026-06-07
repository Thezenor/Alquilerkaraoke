// Dinero SIEMPRE en céntimos (Int) en BD. Conversión y formato para UI.

/** Euros (string o number) → céntimos enteros. "" / inválido → 0. */
export function eurosToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Céntimos → euros (number con 2 decimales como número). */
export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}

/** Céntimos → string para inputs (sin símbolo), ej. 29000 → "290.00". */
export function centsToInput(cents: number): string {
  return centsToEuros(cents).toFixed(2);
}

/** Céntimos → texto con símbolo de moneda, ej. 29000 → "290,00 €". */
export function formatCents(cents: number, currency = "EUR", locale = "es-ES"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(centsToEuros(cents));
}
