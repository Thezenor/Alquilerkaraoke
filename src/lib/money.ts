// Dinero SIEMPRE en céntimos (Int) en BD. Conversión y formato para UI.

/** Euros (string o number) → céntimos enteros. "" / inválido → 0.
 * Acepta separador de miles ("." o " ") y coma o punto decimal: "1.250,50", "1 250.50". */
export function eurosToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else {
    let s = value.trim().replace(/\s/g, "");
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    // El separador decimal es el último que aparezca; el otro son miles.
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
    n = Number(s);
  }
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

/** Céntimos → texto con símbolo de moneda según locale. ej. 29000 → "290,00 €". */
export function formatCents(cents: number, locale: string = "es-ES", currency = "EUR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(centsToEuros(cents));
}
