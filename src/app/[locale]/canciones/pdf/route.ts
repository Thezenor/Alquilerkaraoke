import { prisma } from "@/lib/prisma";
import { buildSongbookPdf } from "@/server/pdf/songbook";
import { languageName } from "@/lib/song-languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 8000; // tope de canciones por PDF (rendimiento)

// PDF del repertorio filtrado por idioma (y opcional búsqueda).
export async function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc: "es" | "en" = locale === "en" ? "en" : "es";
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") ?? "").trim().toUpperCase();
  const q = (url.searchParams.get("q") ?? "").trim();

  const where = {
    isPrimary: true,
    ...(lang ? { languageCode: lang } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { performer: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, songs] = await Promise.all([
    prisma.song.count({ where }),
    prisma.song.findMany({ where, orderBy: [{ title: "asc" }], take: MAX, select: { title: true, performer: true } }),
  ]);

  if (total === 0) return new Response("Sin canciones para ese filtro", { status: 404 });

  const langLabel = lang ? languageName(lang, loc) : loc === "en" ? "All languages" : "Todos los idiomas";
  const bytes = await buildSongbookPdf({
    title: loc === "en" ? "Karaoke songbook" : "Repertorio de karaoke",
    subtitle: `${langLabel} · ${total.toLocaleString("es-ES")} ${loc === "en" ? "songs" : "canciones"}`,
    songs,
    truncatedFrom: total > MAX ? total : undefined,
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="repertorio-${lang || "todos"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
