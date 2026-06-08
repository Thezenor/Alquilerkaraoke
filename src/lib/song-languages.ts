// Leyenda de idiomas para el catálogo de canciones (Fase 6).
// Las abreviaturas son las que usa el Excel del cliente (NO siempre ISO 639-1):
// p. ej. AL=Alemán, IN=Inglés, PO=Portugués, SU=Suomi/Finés, TA=Tailandés.
// La clave de búsqueda es la abreviatura tal cual viene en el Excel (en mayúsculas).

export type SongLanguage = { code: string; es: string; en: string };

export const SONG_LANGUAGES: SongLanguage[] = [
  { code: "AF", es: "Afrikaans", en: "Afrikaans" },
  { code: "SQ", es: "Albanés", en: "Albanian" },
  { code: "AL", es: "Alemán", en: "German" },
  { code: "AR", es: "Árabe", en: "Arabic" },
  { code: "AN", es: "Aragonés", en: "Aragonese" },
  { code: "HY", es: "Armenio", en: "Armenian" },
  { code: "AU", es: "Austriaco", en: "Austrian" },
  { code: "BN", es: "Bengalí", en: "Bengali" },
  { code: "BE", es: "Bielorruso", en: "Belarusian" },
  { code: "MY", es: "Birmano", en: "Burmese" },
  { code: "BS", es: "Bosnio", en: "Bosnian" },
  { code: "BR", es: "Brasileño", en: "Brazilian" },
  { code: "BG", es: "Búlgaro", en: "Bulgarian" },
  { code: "KS", es: "Cachemiro", en: "Kashmiri" },
  { code: "KM", es: "Camboyano", en: "Khmer" },
  { code: "CA", es: "Catalán", en: "Catalan" },
  { code: "CE", es: "Checheno", en: "Chechen" },
  { code: "CS", es: "Checo", en: "Czech" },
  { code: "CH", es: "Chino", en: "Chinese" },
  { code: "ZA", es: "Chuan", en: "Zhuang" },
  { code: "KO", es: "Coreano", en: "Korean" },
  { code: "HR", es: "Croata", en: "Croatian" },
  { code: "DA", es: "Danés", en: "Danish" },
  { code: "SK", es: "Eslovaco", en: "Slovak" },
  { code: "SL", es: "Esloveno", en: "Slovene" },
  { code: "ES", es: "Español", en: "Spanish" },
  { code: "ET", es: "Estonio", en: "Estonian" },
  { code: "EU", es: "Euskera", en: "Basque" },
  { code: "FO", es: "Feroés", en: "Faroese" },
  { code: "FL", es: "Filipino", en: "Philippine" },
  { code: "FR", es: "Francés", en: "French" },
  { code: "GD", es: "Gaélico escocés", en: "Scottish Gaelic" },
  { code: "CY", es: "Galés", en: "Welsh" },
  { code: "GL", es: "Gallego", en: "Galician" },
  { code: "KA", es: "Georgiano", en: "Georgian" },
  { code: "EL", es: "Griego", en: "Greek" },
  { code: "KL", es: "Groenlandés", en: "Kalaallisut" },
  { code: "GN", es: "Guaraní", en: "Guaraní" },
  { code: "GU", es: "Guyaratí", en: "Gujarati" },
  { code: "HT", es: "Haitiano", en: "Haitian" },
  { code: "HE", es: "Hebreo", en: "Hebrew" },
  { code: "HI", es: "Hindi", en: "Hindi" },
  { code: "NL", es: "Holandés", en: "Dutch" },
  { code: "HU", es: "Húngaro", en: "Hungarian" },
  { code: "ID", es: "Indonesio", en: "Indonesian" },
  { code: "IN", es: "Inglés", en: "English" },
  { code: "GA", es: "Irlandés", en: "Irish" },
  { code: "IS", es: "Islandés", en: "Icelandic" },
  { code: "IT", es: "Italiano", en: "Italian" },
  { code: "JA", es: "Japonés", en: "Japanese" },
  { code: "KK", es: "Kazajo", en: "Kazakh" },
  { code: "KG", es: "Kongo", en: "Kongo" },
  { code: "KU", es: "Kurdo", en: "Kurdish" },
  { code: "LA", es: "Latín", en: "Latin" },
  { code: "LV", es: "Letón", en: "Latvian" },
  { code: "LT", es: "Lituano", en: "Lithuanian" },
  { code: "LG", es: "Luganda", en: "Ganda" },
  { code: "LB", es: "Luxemburgués", en: "Luxembourgish" },
  { code: "MK", es: "Macedonio", en: "Macedonian" },
  { code: "ML", es: "Malayalam", en: "Malayalam" },
  { code: "MS", es: "Malayo", en: "Malay" },
  { code: "DV", es: "Maldivo", en: "Maldivian" },
  { code: "MT", es: "Maltés", en: "Maltese" },
  { code: "MI", es: "Maorí", en: "Māori" },
  { code: "MN", es: "Mongol", en: "Mongolian" },
  { code: "NV", es: "Navajo", en: "Navajo" },
  { code: "NE", es: "Nepalí", en: "Nepali" },
  { code: "NG", es: "Nigeria", en: "Nigeria" },
  { code: "NI", es: "Ninguno", en: "Unknown" },
  { code: "NO", es: "Noruego", en: "Norwegian" },
  { code: "OP", es: "Opera", en: "Opera" },
  { code: "FA", es: "Persa", en: "Persian" },
  { code: "PL", es: "Polaco", en: "Polish" },
  { code: "PO", es: "Portugués", en: "Portuguese" },
  { code: "PU", es: "Quechua", en: "Quechua" },
  { code: "RW", es: "Ruandés", en: "Kinyarwanda" },
  { code: "RO", es: "Rumano", en: "Romanian" },
  { code: "RU", es: "Ruso", en: "Russian" },
  { code: "SM", es: "Samoano", en: "Samoan" },
  { code: "SR", es: "Serbio", en: "Serbian" },
  { code: "SO", es: "Somalí", en: "Somali" },
  { code: "SW", es: "Suajili", en: "Swahili" },
  { code: "SV", es: "Sueco", en: "Swedish" },
  { code: "SU", es: "Suomi", en: "Finnish" },
  { code: "TL", es: "Tagalo", en: "Tagalog" },
  { code: "TY", es: "Tahitiano", en: "Tahitian" },
  { code: "TA", es: "Tailandés", en: "Thai" },
  { code: "TT", es: "Tártaro", en: "Tatar" },
  { code: "BO", es: "Tibetano", en: "Tibetan" },
  { code: "TO", es: "Tongano", en: "Tonga" },
  { code: "TR", es: "Turco", en: "Turkish" },
  { code: "TK", es: "Turcomano", en: "Turkmen" },
  { code: "UK", es: "Ucraniano", en: "Ukrainian" },
  { code: "UZ", es: "Uzbeko", en: "Uzbek" },
  { code: "VL", es: "Valenciano", en: "Valencian" },
  { code: "VI", es: "Vietnamita", en: "Vietnamese" },
  { code: "ZU", es: "Zulú", en: "Zulu" },
];

export const LANGUAGE_BY_CODE: Record<string, SongLanguage> = Object.fromEntries(
  SONG_LANGUAGES.map((l) => [l.code, l]),
);

// Bandera (emoji) representativa por idioma. Las abreviaturas son las del cliente.
const LANGUAGE_FLAG: Record<string, string> = {
  AF: "🇿🇦", SQ: "🇦🇱", AL: "🇩🇪", AR: "🇸🇦", AN: "🇪🇸", HY: "🇦🇲", AU: "🇦🇹", BN: "🇧🇩",
  BE: "🇧🇾", MY: "🇲🇲", BS: "🇧🇦", BR: "🇧🇷", BG: "🇧🇬", KS: "🇮🇳", KM: "🇰🇭", CA: "🇪🇸",
  CE: "🇷🇺", CS: "🇨🇿", CH: "🇨🇳", ZA: "🇨🇳", KO: "🇰🇷", HR: "🇭🇷", DA: "🇩🇰", SK: "🇸🇰",
  SL: "🇸🇮", ES: "🇪🇸", ET: "🇪🇪", EU: "🇪🇸", FO: "🇫🇴", FL: "🇵🇭", FR: "🇫🇷", GD: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  CY: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", GL: "🇪🇸", KA: "🇬🇪", EL: "🇬🇷", KL: "🇬🇱", GN: "🇵🇾", GU: "🇮🇳", HT: "🇭🇹",
  HE: "🇮🇱", HI: "🇮🇳", NL: "🇳🇱", HU: "🇭🇺", ID: "🇮🇩", IN: "🇬🇧", GA: "🇮🇪", IS: "🇮🇸",
  IT: "🇮🇹", JA: "🇯🇵", KK: "🇰🇿", KG: "🇨🇩", KU: "🌐", LA: "🇻🇦", LV: "🇱🇻", LT: "🇱🇹",
  LG: "🇺🇬", LB: "🇱🇺", MK: "🇲🇰", ML: "🇮🇳", MS: "🇲🇾", DV: "🇲🇻", MT: "🇲🇹", MI: "🇳🇿",
  MN: "🇲🇳", NV: "🇺🇸", NE: "🇳🇵", NG: "🇳🇬", NI: "🌐", NO: "🇳🇴", OP: "🎭", FA: "🇮🇷",
  PL: "🇵🇱", PO: "🇵🇹", PU: "🇵🇪", RW: "🇷🇼", RO: "🇷🇴", RU: "🇷🇺", SM: "🇼🇸", SR: "🇷🇸",
  SO: "🇸🇴", SW: "🇰🇪", SV: "🇸🇪", SU: "🇫🇮", TL: "🇵🇭", TY: "🇵🇫", TA: "🇹🇭", TT: "🇷🇺",
  BO: "🇨🇳", TO: "🇹🇴", TR: "🇹🇷", TK: "🇹🇲", UK: "🇺🇦", UZ: "🇺🇿", VL: "🇪🇸", VI: "🇻🇳", ZU: "🇿🇦",
};

/** Bandera (emoji) del idioma a partir de su abreviatura. 🌐 si no hay una clara. */
export function flagFor(code: string | null | undefined): string {
  if (!code) return "🌐";
  return LANGUAGE_FLAG[code.trim().toUpperCase()] ?? "🌐";
}

/** Nombre del idioma a partir de su abreviatura del Excel (con fallback al propio código). */
export function languageName(code: string | null | undefined, locale: "es" | "en" = "es"): string {
  if (!code) return locale === "en" ? "Unknown" : "Desconocido";
  const lang = LANGUAGE_BY_CODE[code.trim().toUpperCase()];
  if (!lang) return code.trim().toUpperCase();
  return locale === "en" ? lang.en : lang.es;
}

/** Normaliza una abreviatura del Excel a su forma canónica (o null si no existe). */
export function normalizeLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return LANGUAGE_BY_CODE[code] ? code : null;
}
