import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { runImport } from "@/server/song-import";
import { Role } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.roles, Role.SUPERADMIN, Role.ADMIN)) return null;
  return session;
}

// Estado del último trabajo de importación (para que el admin muestre progreso).
export async function GET() {
  if (!(await guard())) return new Response("No autorizado", { status: 403 });
  const job = await prisma.songImportJob.findFirst({ orderBy: { createdAt: "desc" } });
  return Response.json({ job });
}

// Subida del catálogo: el cuerpo es el fichero (octet-stream); ?name= con el nombre.
// Se guarda por streaming a un temporal y se procesa en segundo plano.
export async function POST(req: Request) {
  const session = await guard();
  if (!session) return new Response("No autorizado", { status: 403 });

  const url = new URL(req.url);
  const filename = (url.searchParams.get("name") ?? "catalogo").replace(/[^\w.\- ]/g, "_").slice(0, 200);
  const lower = filename.toLowerCase();
  const format: "xlsx" | "csv" | null = lower.endsWith(".xlsx") ? "xlsx" : lower.endsWith(".csv") ? "csv" : null;
  if (!format) return new Response("Formato no soportado (usa .xlsx o .csv)", { status: 400 });
  if (!req.body) return new Response("Cuerpo vacío", { status: 400 });

  // No iniciar si ya hay uno en curso.
  const running = await prisma.songImportJob.findFirst({ where: { status: { in: ["PENDING", "RUNNING"] } } });
  if (running) return new Response("Ya hay una importación en curso", { status: 409 });

  const job = await prisma.songImportJob.create({
    data: { filename, format, status: "PENDING", createdById: session.user.id },
  });

  const tmp = join(tmpdir(), `songs-${job.id}.${format}`);
  try {
    await pipeline(Readable.fromWeb(req.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(tmp));
  } catch {
    await prisma.songImportJob.update({ where: { id: job.id }, data: { status: "ERROR", message: "Error al recibir el fichero" } });
    return new Response("Error al recibir el fichero", { status: 500 });
  }

  await logAudit({ userId: session.user.id, action: "songs.import", entity: "SongImportJob", entityId: job.id, metadata: { filename, format } });

  // Procesado en segundo plano (no se espera): el servidor persistente sigue ejecutándolo.
  void runImport(job.id, tmp, format);

  return Response.json({ jobId: job.id });
}
