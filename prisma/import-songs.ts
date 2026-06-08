import "dotenv/config";
import { createReadStream, readFileSync } from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { dedupKey } from "../src/lib/song-dedup";
import { normalizeLanguageCode, languageFromCode } from "../src/lib/song-languages";
import { optimizeCatalog } from "../src/server/songs";

// Importador del catálogo de canciones (CSV). Columnas: Idioma, Código, Título,
// Intérprete, Marca (cabecera detectada por nombre, sin distinción de acentos).
// Reemplaza el catálogo completo (borra canciones, conserva marcas/calidad) y
// optimiza al final. Uso: npm run db:import:songs -- <archivo.csv>
const file = process.argv[2];
if (!file) {
  console.error("Uso: npm run db:import:songs -- <archivo.csv>");
  process.exit(1);
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function detectDelimiter(path: string): string {
  const head = readFileSync(path, "utf8").split(/\r?\n/)[0] ?? "";
  const counts = { ";": head.split(";").length, ",": head.split(",").length, "\t": head.split("\t").length };
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as string) || ",";
}

function buildIndex(header: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    const n = norm(h);
    if (n.includes("idioma")) idx.lang = i;
    else if (n.includes("codigo")) idx.code = i;
    else if (n.includes("titulo")) idx.title = i;
    else if (n.includes("interprete") || n.includes("artista")) idx.performer = i;
    else if (n.includes("marca")) idx.brand = i;
  });
  return idx;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const delimiter = detectDelimiter(file);
  console.log(`Delimitador detectado: ${JSON.stringify(delimiter)}`);

  const brandCache = new Map<string, string>();
  async function ensureBrand(nameRaw: string | undefined): Promise<string | null> {
    const name = (nameRaw ?? "").trim();
    if (!name) return null;
    const cached = brandCache.get(name);
    if (cached) return cached;
    const b = await prisma.songBrand.upsert({ where: { name }, update: {}, create: { name } });
    brandCache.set(name, b.id);
    return b.id;
  }

  try {
    console.log("Borrando catálogo anterior…");
    await prisma.song.deleteMany({});

    const parser = createReadStream(file).pipe(
      parse({ delimiter, bom: true, relax_quotes: true, skip_empty_lines: true, relax_column_count: true }),
    );

    let idx: Record<string, number> | null = null;
    let batch: { languageCode: string; code: string | null; title: string; performer: string; brandId: string | null; dedupKey: string }[] = [];
    let count = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      await prisma.song.createMany({ data: batch });
      count += batch.length;
      batch = [];
      if (count % 10000 === 0) console.log(`  ${count} canciones…`);
    };

    for await (const row of parser as AsyncIterable<string[]>) {
      if (!idx) {
        idx = buildIndex(row);
        if (idx.title === undefined || idx.performer === undefined) {
          throw new Error(`No se encuentran las columnas Título/Intérprete. Cabecera: ${row.join(" | ")}`);
        }
        continue;
      }
      const title = (row[idx.title] ?? "").trim();
      const performer = (row[idx.performer ?? -1] ?? "").trim();
      if (!title) continue;
      const code = idx.code !== undefined ? (row[idx.code] ?? "").trim() || null : null;
      const langRaw = idx.lang !== undefined ? (row[idx.lang] ?? "").trim() : "";
      const languageCode =
        normalizeLanguageCode(langRaw) ?? languageFromCode(code) ?? (langRaw ? langRaw.toUpperCase() : "NI");
      const brandId = idx.brand !== undefined ? await ensureBrand(row[idx.brand]) : null;
      batch.push({ languageCode, code, title, performer, brandId, dedupKey: dedupKey(title, performer) });
      if (batch.length >= 1000) await flush();
    }
    await flush();

    console.log(`Importadas ${count} canciones. Optimizando…`);
    const stats = await optimizeCatalog();
    console.log(`✔ Total: ${stats.total} · No repetidas: ${stats.unique} · Marcas: ${brandCache.size}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
