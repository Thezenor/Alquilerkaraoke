import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { EVENT_TYPES } from "./event-types-data";

// Tipos de evento iniciales. Idempotente (upsert por slug). Ejecutar: npm run db:seed:event-types
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    let i = 0;
    for (const e of EVENT_TYPES) {
      const data = {
        name: e.name,
        shortDescription: e.shortDescription,
        intro: e.intro,
        description: e.description,
        features: e.features,
        faq: e.faq,
        metaTitle: e.metaTitle,
        metaDescription: e.metaDescription,
        sortOrder: i,
      };
      await prisma.eventType.upsert({
        where: { slug: e.slug },
        update: data,
        create: { slug: e.slug, ...data },
      });
      i++;
    }
    const total = await prisma.eventType.count();
    console.log(`Tipos de evento sembrados. Total en BD: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
