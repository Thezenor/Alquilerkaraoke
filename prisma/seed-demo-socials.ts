import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Redes sociales ficticias de ejemplo para el pie de página (editables luego
// en el admin). Solo rellena los campos vacíos (no pisa lo ya configurado).
// Ejecutar: npm run db:seed:socials
const DEMO = {
  instagram: "https://instagram.com/alquilerkaraoke",
  facebook: "https://facebook.com/alquilerkaraoke",
  tiktok: "https://tiktok.com/@alquilerkaraoke",
  youtube: "https://youtube.com/@alquilerkaraoke",
};

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    const cfg = await prisma.siteConfig.findUnique({ where: { id: "default" } });
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(DEMO)) {
      if (!cfg || !(cfg as Record<string, unknown>)[k]) data[k] = v;
    }
    if (Object.keys(data).length === 0) {
      console.log("= redes ya configuradas, no se cambia nada");
      return;
    }
    await prisma.siteConfig.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });
    console.log(`+ redes ficticias añadidas: ${Object.keys(data).join(", ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
