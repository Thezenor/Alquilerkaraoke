import sharp from "sharp";

// Genera imágenes auxiliares para los PDFs premium (glows) con sharp.
// Los buffers se cachean en memoria (el degradado es determinista por color).

const cache = new Map<string, Promise<Buffer>>();

/** PNG con un degradado radial color→transparente (glow suave, estilo CSS blur). */
function radialGlow(hex: string, size = 480, exp = 1.7): Promise<Buffer> {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const buf = Buffer.alloc(size * size * 4);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = Math.min(1, Math.hypot(x - c, y - c) / c);
      const a = Math.pow(Math.max(0, 1 - t), exp); // caída suave hacia los bordes
      const i = (y * size + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
}

/** Devuelve (cacheado) el PNG del glow para un color #RRGGBB. */
export function glowPng(hex: string): Promise<Buffer> {
  let p = cache.get(hex);
  if (!p) {
    p = radialGlow(hex);
    cache.set(hex, p);
  }
  return p;
}
