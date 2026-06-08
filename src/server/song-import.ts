import { createReadStream, readFileSync, promises as fsp } from "fs";
import { parse } from "csv-parse";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { updateTag } from "next/cache";
import { dedupKey } from "@/lib/song-dedup";
import { normalizeLanguageCode } from "@/lib/song-languages";
import { optimizeCatalog, SONGS_TAG } from "@/server/songs";

type ColIndex = { lang?: number; code?: number; title?: number; performer?: number; brand?: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function buildIndex(header: string[]): ColIndex {
  const idx: ColIndex = {};
  header.forEach((h, i) => {
    const n = norm(String(h ?? ""));
    if (n.includes("idioma")) idx.lang = i;
    else if (n.includes("codigo")) idx.code = i;
    else if (n.includes("titulo")) idx.title = i;
    else if (n.includes("interprete") || n.includes("artista")) idx.performer = i;
    else if (n.includes("marca")) idx.brand = i;
  });
  return idx;
}

/** Texto plano de una celda de exceljs (maneja richText, hyperlink y fórmulas). */
function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (typeof o.text === "string") return o.text;
    if (Array.isArray(o.richText)) return o.richText.map((r) => r.text).join("");
    if (o.result != null) return String(o.result);
    return "";
  }
  return String(v);
}

function detectDelimiter(path: string): string {
  const head = readFileSync(path, { encoding: "utf8" }).split(/\r?\n/)[0] ?? "";
  const counts: Record<string, number> = { ";": head.split(";").length, ",": head.split(",").length, "\t": head.split("\t").length };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",";
}

/**
 * Procesa el fichero subido (xlsx o csv) en segundo plano: reemplaza el catálogo,
 * inserta por lotes, optimiza y actualiza el SongImportJob. Borra el temporal al final.
 */
export async function runImport(jobId: string, filePath: string, format: "xlsx" | "csv"): Promise<void> {
  const brandCache = new Map<string, string>();
  const ensureBrand = async (nameRaw: string): Promise<string | null> => {
    const name = nameRaw.trim();
    if (!name) return null;
    const cached = brandCache.get(name);
    if (cached) return cached;
    const b = await prisma.songBrand.upsert({ where: { name }, update: {}, create: { name } });
    brandCache.set(name, b.id);
    return b.id;
  };

  let batch: { languageCode: string; code: string | null; title: string; performer: string; brandId: string | null; dedupKey: string }[] = [];
  let processed = 0;
  let imported = 0;

  const flush = async () => {
    if (!batch.length) return;
    await prisma.song.createMany({ data: batch });
    imported += batch.length;
    batch = [];
  };

  const addRow = async (idx: ColIndex, cells: string[]) => {
    processed++;
    const title = (idx.title !== undefined ? cells[idx.title] : "")?.trim() ?? "";
    if (!title) return;
    const performer = (idx.performer !== undefined ? cells[idx.performer] : "")?.trim() ?? "";
    const langRaw = (idx.lang !== undefined ? cells[idx.lang] : "")?.trim() ?? "";
    const languageCode = normalizeLanguageCode(langRaw) ?? (langRaw ? langRaw.toUpperCase().slice(0, 8) : "NI");
    const code = idx.code !== undefined ? (cells[idx.code] ?? "").trim() || null : null;
    const brandId = idx.brand !== undefined ? await ensureBrand(cells[idx.brand] ?? "") : null;
    batch.push({ languageCode, code, title, performer, brandId, dedupKey: dedupKey(title, performer) });
    if (batch.length >= 1000) {
      await flush();
      if (processed % 20000 === 0) {
        await prisma.songImportJob.update({ where: { id: jobId }, data: { processed, imported } });
      }
    }
  };

  try {
    await prisma.songImportJob.update({ where: { id: jobId }, data: { status: "RUNNING" } });
    await prisma.song.deleteMany({});

    if (format === "csv") {
      const delimiter = detectDelimiter(filePath);
      const parser = createReadStream(filePath).pipe(
        parse({ delimiter, bom: true, relax_quotes: true, skip_empty_lines: true, relax_column_count: true }),
      );
      let idx: ColIndex | null = null;
      for await (const row of parser as AsyncIterable<string[]>) {
        if (!idx) {
          idx = buildIndex(row);
          if (idx.title === undefined) throw new Error("No se encuentra la columna Título en el CSV.");
          continue;
        }
        await addRow(idx, row);
      }
    } else {
      const wb = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
      let idx: ColIndex | null = null;
      for await (const worksheet of wb) {
        for await (const row of worksheet) {
          const values = row.values as unknown[]; // 1-indexed (values[0] vacío)
          const cells = values.map((v) => cellText(v));
          // exceljs es 1-indexed: desplazamos para que el índice 0 = primera columna.
          const shifted = cells.slice(1);
          if (!idx) {
            idx = buildIndex(shifted);
            if (idx.title === undefined) throw new Error("No se encuentra la columna Título en el Excel.");
            continue;
          }
          await addRow(idx, shifted);
        }
        break; // solo la primera hoja
      }
    }

    await flush();
    const stats = await optimizeCatalog();
    await prisma.songImportJob.update({
      where: { id: jobId },
      data: { status: "DONE", processed, imported, uniqueCount: stats.unique, finishedAt: new Date() },
    });
    try {
      updateTag(SONGS_TAG); // refresca contadores por idioma en la web
    } catch {
      /* fuera de scope de request: la caché se refresca por revalidate */
    }
  } catch (e) {
    await prisma.songImportJob.update({
      where: { id: jobId },
      data: { status: "ERROR", processed, imported, message: e instanceof Error ? e.message.slice(0, 500) : "error", finishedAt: new Date() },
    });
  } finally {
    await fsp.unlink(filePath).catch(() => {});
  }
}
