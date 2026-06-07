export type City = { slug: string; name: string };

// Ciudades iniciales (DECISIONS.md / docs 05-seo). Gestionables desde admin en el futuro.
export const CITIES: City[] = [
  { slug: "madrid", name: "Madrid" },
  { slug: "barcelona", name: "Barcelona" },
  { slug: "valencia", name: "Valencia" },
  { slug: "sevilla", name: "Sevilla" },
  { slug: "malaga", name: "Málaga" },
  { slug: "zaragoza", name: "Zaragoza" },
  { slug: "alicante", name: "Alicante" },
  { slug: "murcia", name: "Murcia" },
  { slug: "albacete", name: "Albacete" },
  { slug: "toledo", name: "Toledo" },
  { slug: "cuenca", name: "Cuenca" },
  { slug: "ciudad-real", name: "Ciudad Real" },
  { slug: "castellon", name: "Castellón" },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
