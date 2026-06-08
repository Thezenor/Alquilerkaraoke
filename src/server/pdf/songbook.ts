import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

// Repertorio en PDF (A4, 2 columnas, compacto). Pensado para una lista filtrada
// (por idioma). Para catálogos enormes se limita el número de canciones.

export type SongbookData = {
  title: string;
  subtitle: string;
  songs: { title: string; performer: string }[];
  truncatedFrom?: number; // total real si la lista se ha recortado
};

const A4 = { w: 595.28, h: 841.89 };
const M = 40;
const COL_GAP = 24;
const LINE = 11; // alto de línea
const FONT_SIZE = 8;

const safe = (s: string) => (s ?? "").replace(/[^\x20-\xFF€]/g, "").trim();

export async function buildSongbookPdf(data: SongbookData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(data.title);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const colWidth = (A4.w - 2 * M - COL_GAP) / 2;
  const topY = A4.h - M - 48; // deja espacio para cabecera
  const bottomY = M + 16;
  const linesPerCol = Math.floor((topY - bottomY) / LINE);
  const perPage = linesPerCol * 2;

  let page = pdf.addPage([A4.w, A4.h]);
  let pageIndex = 0;

  const header = () => {
    page.drawText(safe(data.title), { x: M, y: A4.h - M - 6, size: 15, font: bold, color: rgb(0.07, 0.09, 0.11) });
    page.drawText(safe(data.subtitle), { x: M, y: A4.h - M - 24, size: 9, font, color: rgb(0.42, 0.45, 0.5) });
    page.drawLine({ start: { x: M, y: topY + 8 }, end: { x: A4.w - M, y: topY + 8 }, thickness: 0.6, color: rgb(0.82, 0.84, 0.86) });
  };
  header();

  const truncate = (s: string, f: PDFFont, max: number) => {
    let t = safe(s);
    while (t.length > 1 && f.widthOfTextAtSize(t, FONT_SIZE) > max) t = t.slice(0, -1);
    return t;
  };

  data.songs.forEach((song, i) => {
    const posInPage = i % perPage;
    if (i > 0 && posInPage === 0) {
      page = pdf.addPage([A4.w, A4.h]);
      pageIndex++;
      header();
    }
    const col = Math.floor(posInPage / linesPerCol);
    const row = posInPage % linesPerCol;
    const x = M + col * (colWidth + COL_GAP);
    const y = topY - row * LINE;
    const line = `${song.title} — ${song.performer}`;
    page.drawText(truncate(line, font, colWidth), { x, y, size: FONT_SIZE, font, color: rgb(0.1, 0.12, 0.16) });
  });

  if (data.truncatedFrom) {
    page.drawText(
      safe(`Mostrando ${data.songs.length} de ${data.truncatedFrom} canciones. Usa el buscador de la web para el resto.`),
      { x: M, y: M, size: 7.5, font, color: rgb(0.42, 0.45, 0.5) },
    );
  }
  void pageIndex;

  return pdf.save();
}
