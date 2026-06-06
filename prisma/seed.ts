import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Configuración de empresa / branding (singleton) ──
  await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Alquiler Karaoke",
      phone: "607724965",
    },
  });
  console.log("✔ SiteConfig por defecto asegurado.");

  // ── Usuario Superadmin ──
  const email = process.env.SUPERADMIN_EMAIL ?? "admin@alquilerkaraoke.com";
  const password = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!";

  if (!process.env.SUPERADMIN_PASSWORD) {
    console.warn(
      "⚠ SUPERADMIN_PASSWORD no definido en .env — se usa una contraseña por defecto. CÁMBIALA.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { roles: ["SUPERADMIN"], isActive: true },
    create: {
      email,
      name: "Superadmin",
      passwordHash,
      roles: ["SUPERADMIN"],
      emailVerified: new Date(),
    },
  });
  console.log(`✔ Superadmin asegurado: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
