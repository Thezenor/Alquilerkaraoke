import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Servicios de ejemplo, mapeados a las categorías de packs del catálogo.
// Idempotente: no duplica por slug. Ejecutar: npm run db:seed:services
const SERVICES = [
  {
    slug: "karaoke",
    name: "Alquiler de karaoke",
    category: "Karaoke",
    shortDescription: "Karaoke profesional con equipo, pantallas y miles de canciones, con o sin técnico.",
    description:
      "# Karaoke profesional para tu evento\n\nMontamos un karaoke completo con **sonido profesional**, pantallas, microfonía inalámbrica y un catálogo con miles de canciones en varios idiomas.\n\n- Equipo y montaje incluidos\n- Con o sin técnico\n- Ideal para fiestas, cumpleaños, bodas y eventos de empresa\n\nElige una de nuestras opciones o pídenos un presupuesto a medida.",
    sortOrder: 1,
  },
  {
    slug: "gaming-consolas",
    name: "Gaming y consolas",
    category: "Gaming / Consolas",
    shortDescription: "Torneos y zonas de juego con consolas, pantallas y mandos para todos los asistentes.",
    description:
      "# Zona gaming para tu evento\n\nLlevamos **consolas, televisiones y mandos** para montar una zona de juego o un torneo. Perfecto para cumpleaños, eventos de empresa y activaciones.\n\n- Varias consolas y pantallas\n- Juegos a elegir\n- Montaje y cableado incluidos",
    sortOrder: 2,
  },
  {
    slug: "fiesta-de-la-espuma",
    name: "Fiesta de la espuma",
    category: "Fiesta de Espuma",
    shortDescription: "Cañón de espuma y música para una fiesta refrescante e inolvidable.",
    description:
      "# Fiesta de la espuma\n\nDiversión asegurada con **cañón de espuma** y equipo de sonido con música de baile. Ideal para fiestas de verano, campamentos y eventos al aire libre.",
    sortOrder: 3,
  },
  {
    slug: "fiesta-holi",
    name: "Fiesta Holi",
    category: "Fiesta Holi",
    shortDescription: "Color, música y animación con polvos Holi para eventos llenos de energía.",
    description:
      "# Fiesta Holi\n\nUna explosión de **color y música** con polvos Holi, DJ, iluminación y animación. Disponible en varios tamaños según el número de asistentes.",
    sortOrder: 4,
  },
  {
    slug: "evento-furor",
    name: "Evento Furor",
    category: "Evento Furor",
    shortDescription: "El concurso musical tipo Furor con DJ animador, micrófonos y producción completa.",
    description:
      "# Evento Furor\n\nRevive el mítico concurso musical: **DJ animador**, micrófonos para los participantes, sonido e iluminación profesionales y organización completa del concurso.",
    sortOrder: 5,
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    for (const s of SERVICES) {
      const exists = await prisma.service.findUnique({ where: { slug: s.slug } });
      if (exists) {
        console.log(`= ${s.slug} (ya existe)`);
        continue;
      }
      await prisma.service.create({ data: { ...s, isActive: true } });
      console.log(`+ ${s.slug}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
