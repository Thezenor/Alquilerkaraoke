import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Marcas colaboradoras de ejemplo (CLAUDE.md). Idempotente: no duplica por nombre.
// Ejecutar: npm run db:seed:collaborators
const EXAMPLES: { name: string; url?: string; description?: string; sortOrder: number }[] = [
  { name: "Zenor Audiovisual", url: "https://zenor.es", description: "Producción audiovisual y eventos.", sortOrder: 1 },
  { name: "KaraokeMedia", url: "https://www.karaokemedia.com", description: "Contenido y catálogo de karaoke.", sortOrder: 2 },
  { name: "Karaoke Machines", description: "Equipos de karaoke profesional.", sortOrder: 3 },
  { name: "OkeBox", description: "Karaoke autónomo por días.", sortOrder: 4 },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    for (const c of EXAMPLES) {
      const exists = await prisma.collaborator.findFirst({ where: { name: c.name } });
      if (exists) {
        console.log(`= ${c.name} (ya existe)`);
        continue;
      }
      await prisma.collaborator.create({
        data: { name: c.name, url: c.url ?? null, description: c.description ?? null, sortOrder: c.sortOrder, isActive: true },
      });
      console.log(`+ ${c.name}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
