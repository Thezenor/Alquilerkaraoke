import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const field = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;

// Exporta el catálogo (versiones no repetidas) a CSV por streaming.
export async function GET() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.roles, Role.SUPERADMIN, Role.ADMIN)) {
    return new Response("No autorizado", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode("Idioma;Titulo;Interprete;Marca\n"));
      const size = 5000;
      let cursor: string | undefined;
      try {
        for (;;) {
          const rows = await prisma.song.findMany({
            where: { isPrimary: true },
            orderBy: { id: "asc" },
            take: size,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            select: { id: true, languageCode: true, title: true, performer: true, brand: { select: { name: true } } },
          });
          if (rows.length === 0) break;
          let chunk = "";
          for (const r of rows) {
            chunk += [field(r.languageCode), field(r.title), field(r.performer), field(r.brand?.name ?? "")].join(";") + "\n";
          }
          controller.enqueue(encoder.encode(chunk));
          cursor = rows[rows.length - 1].id;
          if (rows.length < size) break;
        }
      } catch {
        // corta el stream ante un error de BD
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="catalogo-canciones.csv"',
      "Cache-Control": "no-store",
    },
  });
}
