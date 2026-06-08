import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_CITIES } from "../src/lib/cities";

// Ciudades iniciales. Idempotente (upsert por slug). Ejecutar: npm run db:seed:cities
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    let i = 0;
    for (const c of DEFAULT_CITIES) {
      await prisma.city.upsert({
        where: { slug: c.slug },
        update: { name: c.name, province: c.province, region: c.region, nearby: c.nearby },
        create: { ...c, sortOrder: i },
      });
      i++;
    }
    const total = await prisma.city.count();
    console.log(`Ciudades sembradas. Total en BD: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
