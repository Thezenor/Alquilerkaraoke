// Datos por defecto de ciudades (para el seed inicial). Una vez en BD, se gestionan
// desde el admin (/admin/ciudades). Las páginas públicas leen de BD vía @/server/cities.

export type CityData = {
  slug: string;
  name: string;
  province: string;
  region: string;
  nearby: string[];
};

export const DEFAULT_CITIES: CityData[] = [
  {
    slug: "madrid",
    name: "Madrid",
    province: "Madrid",
    region: "Comunidad de Madrid",
    nearby: ["Alcalá de Henares", "Getafe", "Móstoles", "Alcorcón", "Leganés", "Fuenlabrada", "Las Rozas", "Pozuelo de Alarcón"],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    province: "Barcelona",
    region: "Cataluña",
    nearby: ["L'Hospitalet de Llobregat", "Badalona", "Sabadell", "Terrassa", "Mataró", "Sant Cugat del Vallès", "Cornellà de Llobregat"],
  },
  {
    slug: "valencia",
    name: "Valencia",
    province: "Valencia",
    region: "Comunidad Valenciana",
    nearby: ["Torrent", "Paterna", "Mislata", "Burjassot", "Gandía", "Sagunto", "Xàtiva"],
  },
  {
    slug: "sevilla",
    name: "Sevilla",
    province: "Sevilla",
    region: "Andalucía",
    nearby: ["Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija", "Carmona"],
  },
  {
    slug: "malaga",
    name: "Málaga",
    province: "Málaga",
    region: "Andalucía",
    nearby: ["Marbella", "Torremolinos", "Fuengirola", "Vélez-Málaga", "Benalmádena", "Mijas", "Estepona"],
  },
  {
    slug: "zaragoza",
    name: "Zaragoza",
    province: "Zaragoza",
    region: "Aragón",
    nearby: ["Utebo", "Calatayud", "Ejea de los Caballeros", "Tarazona", "Cuarte de Huerva", "La Almunia de Doña Godina"],
  },
  {
    slug: "alicante",
    name: "Alicante",
    province: "Alicante",
    region: "Comunidad Valenciana",
    nearby: ["Elche", "Santa Pola", "San Vicente del Raspeig", "Benidorm", "Elda", "Alcoy", "Torrevieja"],
  },
  {
    slug: "murcia",
    name: "Murcia",
    province: "Murcia",
    region: "Región de Murcia",
    nearby: ["Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Águilas", "Yecla", "Cieza"],
  },
  {
    slug: "albacete",
    name: "Albacete",
    province: "Albacete",
    region: "Castilla-La Mancha",
    nearby: ["Hellín", "Villarrobledo", "Almansa", "La Roda", "Caudete", "Tobarra"],
  },
  {
    slug: "toledo",
    name: "Toledo",
    province: "Toledo",
    region: "Castilla-La Mancha",
    nearby: ["Talavera de la Reina", "Illescas", "Torrijos", "Seseña", "Ocaña", "Mora", "Consuegra"],
  },
  {
    slug: "cuenca",
    name: "Cuenca",
    province: "Cuenca",
    region: "Castilla-La Mancha",
    nearby: ["Tarancón", "San Clemente", "Motilla del Palancar", "Las Pedroñeras", "Quintanar del Rey"],
  },
  {
    slug: "ciudad-real",
    name: "Ciudad Real",
    province: "Ciudad Real",
    region: "Castilla-La Mancha",
    nearby: ["Puertollano", "Tomelloso", "Alcázar de San Juan", "Valdepeñas", "Daimiel", "Manzanares"],
  },
  {
    slug: "castellon",
    name: "Castellón",
    province: "Castellón",
    region: "Comunidad Valenciana",
    nearby: ["Vila-real", "Burriana", "Vinaròs", "Benicàssim", "Almassora", "Onda", "La Vall d'Uixò"],
  },
];

/** Agrupa ciudades por comunidad autónoma, conservando el orden de aparición. */
export function citiesByRegion<T extends { region: string }>(cities: T[]): { region: string; cities: T[] }[] {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const c of cities) {
    if (!map.has(c.region)) {
      map.set(c.region, []);
      order.push(c.region);
    }
    map.get(c.region)!.push(c);
  }
  return order.map((region) => ({ region, cities: map.get(region)! }));
}

// Traducción de las comunidades autónomas (conjunto cerrado) para no mostrar
// el nombre en español dentro de las versiones EN/FR de las landings.
const REGION_I18N: Record<string, { en: string; fr: string }> = {
  "Comunidad de Madrid": { en: "Madrid region", fr: "Communauté de Madrid" },
  Cataluña: { en: "Catalonia", fr: "Catalogne" },
  "Comunidad Valenciana": { en: "Valencian Community", fr: "Communauté valencienne" },
  Andalucía: { en: "Andalusia", fr: "Andalousie" },
  Aragón: { en: "Aragon", fr: "Aragon" },
  "Región de Murcia": { en: "Region of Murcia", fr: "Région de Murcie" },
  "Castilla-La Mancha": { en: "Castilla-La Mancha", fr: "Castille-La Manche" },
};

/** Nombre de la comunidad autónoma en el idioma dado (fallback al original en ES). */
export function regionLabel(region: string, locale: string): string {
  if (locale === "en") return REGION_I18N[region]?.en ?? region;
  if (locale === "fr") return REGION_I18N[region]?.fr ?? region;
  return region;
}

/** Índice de variante determinista por slug (para rotar textos sin repetir entre ciudades). */
export function variantIndex(slug: string, count: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return count > 0 ? h % count : 0;
}

/** Convierte un nombre en slug ASCII (para crear ciudades desde el admin). */
export function slugifyCity(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
