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

  // ── Configuración de precios (singleton) ──
  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", vatPercent: 21, currency: "EUR" },
  });

  // ── Packs iniciales (precios PLACEHOLDER en céntimos, sin IVA; editables en admin) ──
  const packs = [
    { slug: "okebox-dia-completo", name: "OkeBox día completo", basePrice: 19000, isPerDay: true, extraHourPrice: 0, sortOrder: 1, shortDescription: "Karaoke autónomo para todo el día." },
    { slug: "karaoke-fiesta", name: "Karaoke Fiesta", basePrice: 29000, extraHourPrice: 6000, sortOrder: 2, shortDescription: "Lo esencial para tu fiesta." },
    { slug: "karaoke-evento", name: "Karaoke Evento", basePrice: 39000, extraHourPrice: 7000, sortOrder: 3, shortDescription: "Para eventos con más invitados." },
    { slug: "karaoke-premium", name: "Karaoke Premium", basePrice: 59000, extraHourPrice: 9000, sortOrder: 4, shortDescription: "Equipo top, sonido e iluminación." },
    { slug: "cabina-karaoke", name: "Cabina Karaoke", basePrice: 35000, extraHourPrice: 6000, sortOrder: 5, shortDescription: "Cabina cerrada tipo OkeBox." },
    { slug: "karaoke-empresa", name: "Karaoke Empresa", basePrice: 49000, extraHourPrice: 8000, sortOrder: 6, shortDescription: "Eventos de empresa y activaciones." },
    { slug: "karaoke-dj", name: "Karaoke + DJ", basePrice: 69000, extraHourPrice: 10000, sortOrder: 7, shortDescription: "Karaoke y DJ para no parar." },
    { slug: "evento-furor", name: "Evento Furor / concurso musical", basePrice: 79000, extraHourPrice: 12000, sortOrder: 8, shortDescription: "Concurso musical tipo Furor." },
  ];
  for (const p of packs) {
    await prisma.pack.upsert({
      where: { slug: p.slug },
      update: {}, // no pisar ediciones del admin
      create: { ...p, includedHours: p.isPerDay ? 0 : 4, depositType: "PERCENT", depositValue: 30 },
    });
  }
  console.log(`✔ ${packs.length} packs asegurados.`);

  // ── Extras iniciales (placeholder, céntimos sin IVA) ──
  const extras = [
    { slug: "pantalla-extra", name: "Pantalla extra", price: 5000, sortOrder: 1 },
    { slug: "microfono-extra", name: "Micrófono inalámbrico extra", price: 3000, sortOrder: 2 },
    { slug: "tecnico-hora-extra", name: "Hora extra de técnico", price: 6000, sortOrder: 3 },
    { slug: "humo-luces", name: "Máquina de humo y luces", price: 8000, sortOrder: 4 },
  ];
  for (const e of extras) {
    await prisma.extra.upsert({ where: { slug: e.slug }, update: {}, create: e });
  }
  console.log(`✔ ${extras.length} extras asegurados.`);

  // ── Suplementos de ejemplo (editables) ──
  for (const s of [
    { province: "Madrid", amount: 0 },
    { province: "Barcelona", amount: 4000 },
  ]) {
    await prisma.provinceSupplement.upsert({
      where: { province: s.province },
      update: {},
      create: s,
    });
  }

  for (const s of [
    { id: "seed-weekend", name: "Fin de semana", type: "WEEKEND" as const, valueType: "PERCENT" as const, value: 15 },
    { id: "seed-night", name: "Nocturnidad", type: "NIGHT" as const, valueType: "PERCENT" as const, value: 20 },
  ]) {
    await prisma.surcharge.upsert({ where: { id: s.id }, update: {}, create: s });
  }
  console.log("✔ Suplementos de ejemplo asegurados.");
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
