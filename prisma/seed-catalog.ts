import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const eur = (n: number) => Math.round(n * 100); // € → céntimos

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Zonas tarifarias (suplemento en €) y provincias ──
const ZONES = [
  {
    name: "Zona 1",
    supplement: 0,
    pendingConfig: false,
    provinces: ["Albacete", "Alicante", "Ciudad Real", "Cuenca", "Guadalajara", "Madrid", "Murcia", "Toledo", "Valencia"],
  },
  {
    name: "Zona 2",
    supplement: 120,
    pendingConfig: false,
    provinces: ["Almería", "Ávila", "Badajoz", "Cáceres", "Castellón", "Granada", "Jaén", "Salamanca", "Segovia", "Soria", "Teruel", "Valladolid", "Zamora", "Zaragoza"],
  },
  {
    name: "Zona 3",
    supplement: 240,
    pendingConfig: false,
    provinces: ["La Coruña", "Álava", "Asturias", "Barcelona", "Burgos", "Cádiz", "Cantabria", "Córdoba", "Girona", "Guipúzcoa", "Huelva", "Huesca", "La Rioja", "León", "Lleida", "Lugo", "Málaga", "Navarra", "Orense", "Palencia", "Pontevedra", "Sevilla", "Tarragona", "Vizcaya"],
  },
  {
    name: "Zona 4",
    supplement: 0,
    pendingConfig: true, // sin suplemento definido en el Excel
    provinces: ["Islas Baleares", "Las Palmas", "Santa Cruz de Tenerife"],
  },
];

// ── Productos / packs reales (precio en €, sin IVA) ──
const PRODUCTS = [
  { slug: "karaoke-opcion-1", name: "Karaoke Opción 1", price: 550, hours: 4, category: "Karaoke", active: true, desc: 'Equipo profesional de karaoke de hasta 1200W RMS\nMicrofonía inalámbrica\nCatálogo líder en Europa con más de 180.000 canciones (español, inglés, italiano, francés, alemán, portugués, catalán, gallego y más)\nMonitores de 42" para el público y monitor de 40" para el cantante\nAmenización musical entre canciones\nDesplazamiento, montaje y desmontaje incluido\nSeguro de responsabilidad civil' },
  { slug: "karaoke-opcion-1-plus", name: "Karaoke Opción 1 Plus", price: 750, hours: 4, category: "Karaoke", active: true, desc: 'Todo lo del Opción 1, más iluminación:\n4 robots LED, 4 focos LED RGB, 4 wash LED, máquina de humo y FX.\nOpciones ampliables: sonido 4800W RMS, pantalla/proyector 3x3 m (4000 lúmenes).' },
  { slug: "karaoke-opcion-2", name: "Karaoke Opción 2", price: 1050, hours: 4, category: "Karaoke", active: true, desc: 'Equipo profesional de karaoke de hasta 4200W\nMicrofonía inalámbrica Sennheiser\nAmplio catálogo en español y más de 80.000 temas en otros idiomas\n2 pantallas de 43" + monitor de 32" para el cantante\nDiscomóvil para música de baile\nPantalla táctil para peticiones\nIluminación espectacular: 8 focos LED, 2 robots 250W, 2 wash LED, humo\nHasta 4 horas de evento' },
  { slug: "karaoke-opcion-3", name: "Karaoke Opción 3", price: 1500, hours: 4, category: "Karaoke", active: true, desc: "" },
  { slug: "karaoke-personalizado", name: "Karaoke Personalizado", price: 0, hours: 4, category: "Karaoke", active: false, desc: "" },
  { slug: "consolas-opcion-1", name: "Consolas Opción 1", price: 550, hours: 4, category: "Gaming / Consolas", active: true, desc: '4 consolas PS4\nMandos adecuados\n4 televisiones de 42" + soportes\nCableado necesario\nJuegos a definir por el cliente' },
  { slug: "consolas-opcion-2", name: "Consolas Opción 2", price: 1050, hours: 4, category: "Gaming / Consolas", active: true, desc: '8 consolas PS4\nMandos adecuados\n8 televisiones de 42" + soportes\nCableado necesario\nJuegos a definir por el cliente' },
  { slug: "consolas-opcion-vr", name: "Consolas Opción VR", price: 550, hours: 4, category: "Gaming / Consolas", active: true, desc: '2 consolas PS4 Pro\nMandos adecuados\n1 cámara PS4\n2 televisiones de 42" + soportes\nCableado necesario\nJuegos a definir por el cliente' },
  { slug: "consolas-opcion-4", name: "Consolas Opción 4", price: 0, hours: 4, category: "Gaming / Consolas", active: false, desc: "" },
  { slug: "fiesta-de-la-espuma", name: "Fiesta de la Espuma", price: 500, hours: 2, category: "Fiesta de Espuma", active: true, desc: "2 horas de evento con cañón de espuma\nEquipo de sonido 1200W con música de baile" },
  { slug: "holi-1-evento-pequeno", name: "Holi 1 (Evento Pequeño)", price: 850, hours: 2, category: "Fiesta Holi", active: true, desc: "Equipo de sonido 1200W RMS\nPersonal técnico y música ambiental\n100 bolsas de polvos Holi\nAnimador/presentador\nEvento de hasta 2 horas" },
  { slug: "holi-2-evento-mediano", name: "Holi 2 (Evento Mediano)", price: 2000, hours: 4, category: "Fiesta Holi", active: true, desc: "Equipo de sonido 4200W RMS\nPuente de iluminación de 4 m con focos LED, robótica y humo\nPersonal técnico + DJ\n500 bolsas de polvos Holi\nAnimador/presentador\nEvento de hasta 4 horas" },
  { slug: "holi-3-evento-grande", name: "Holi 3 (Evento Grande)", price: 3300, hours: 4, category: "Fiesta Holi", active: true, desc: "Equipo de sonido 6800W RMS\nPuente de iluminación de 4 m con focos LED, robótica y humo\nPersonal técnico + DJ profesional\n1500 bolsas de polvos Holi\nAnimador/presentador + 2 bailarines Holi\nGrabación en vídeo resumen (120 min)\nEvento de hasta 4 horas" },
  { slug: "furor", name: "Furor", price: 1900, hours: 4, category: "Evento Furor", active: true, desc: "Equipo de sonido 4200W RMS\nPuente de iluminación de 4 m con focos LED, robótica y humo\nPersonal técnico y música ambiental\nDJ animador/presentador + organización del concurso Furor\n8 micrófonos para los participantes\nEvento de hasta 4 horas" },
];

// ── Extras reales (precio en €) ──
const EXTRAS = [
  { slug: "grabacion-video-resumen", name: "Grabación en vídeo resumen", price: 150, category: "Holi" },
  { slug: "emision-directo-red-social", name: "Emisión en directo en redes", price: 150, category: "Holi" },
  { slug: "100-bolsas-holi", name: "100 bolsas de color Holi", price: 150, category: "Holi" },
  { slug: "500-bolsas-holi", name: "500 bolsas de color Holi", price: 520, category: "Holi" },
  { slug: "extintor-holi-6kg", name: "Extintor Holi 6 kg", price: 120, category: "Holi" },
  { slug: "consola-adicional", name: "Consola adicional", price: 50, category: "Gaming / Consolas" },
  { slug: "tv-43-soporte", name: 'TV 43" + soporte', price: 50, category: "Gaming / Consolas" },
  { slug: "mando-consola", name: "Mando de consola", price: 25, category: "Gaming / Consolas" },
  { slug: "gafas-vr-camara", name: "Gafas VR + cámara", price: 150, category: "Gaming / Consolas" },
];

// Placeholders de la Fase 3 a desactivar (no eran datos reales)
const OLD_PACK_SLUGS = ["okebox-dia-completo", "karaoke-fiesta", "karaoke-evento", "karaoke-premium", "cabina-karaoke", "karaoke-empresa", "karaoke-dj", "evento-furor"];
const OLD_EXTRA_SLUGS = ["pantalla-extra", "microfono-extra", "tecnico-hora-extra", "humo-luces"];

async function main() {
  // Zonas + provincias
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    const zone = await prisma.tariffZone.upsert({
      where: { name: z.name },
      update: {}, // no pisar ediciones de admin
      create: { name: z.name, supplement: eur(z.supplement), pendingConfig: z.pendingConfig, sortOrder: i + 1 },
    });
    for (const provName of z.provinces) {
      await prisma.province.upsert({
        where: { name: provName },
        update: {},
        create: { name: provName, slug: slugify(provName), zoneId: zone.id },
      });
    }
  }
  console.log(`✔ ${ZONES.length} zonas y provincias aseguradas.`);

  // Productos
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    await prisma.pack.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: eur(p.price),
        includedHours: p.hours,
        description: p.desc || null,
        shortDescription: null,
        isActive: p.active,
        sortOrder: i + 1,
        depositType: "PERCENT",
        depositValue: 30,
      },
    });
  }
  console.log(`✔ ${PRODUCTS.length} productos asegurados.`);

  // Extras
  for (let i = 0; i < EXTRAS.length; i++) {
    const e = EXTRAS[i];
    await prisma.extra.upsert({
      where: { slug: e.slug },
      update: {},
      create: { slug: e.slug, name: e.name, category: e.category, price: eur(e.price), sortOrder: i + 1 },
    });
  }
  console.log(`✔ ${EXTRAS.length} extras asegurados.`);

  // Desactivar placeholders de la Fase 3
  const dp = await prisma.pack.updateMany({ where: { slug: { in: OLD_PACK_SLUGS } }, data: { isActive: false } });
  const de = await prisma.extra.updateMany({ where: { slug: { in: OLD_EXTRA_SLUGS } }, data: { isActive: false } });
  console.log(`✔ Placeholders desactivados: ${dp.count} packs, ${de.count} extras.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
