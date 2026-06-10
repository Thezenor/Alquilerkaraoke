import { readUpload, uploadMtime } from "@/lib/uploads";

export const runtime = "nodejs";

// Sirve los archivos subidos al Volume (/media/<archivo>). Solo .webp generados por saveImage.
// El nombre es un UUID inmutable: el ETag derivado del nombre nunca cambia, así que las
// peticiones condicionales (If-None-Match / If-Modified-Since) devuelven 304 sin leer el disco.
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const name = parts.join("/");
  if (!name.endsWith(".webp") || name.includes("/")) {
    return new Response("Not found", { status: 404 });
  }

  const etag = `"${name}"`;
  const mtime = await uploadMtime(name);
  if (!mtime) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "content-type": "image/webp",
    "cache-control": "public, max-age=31536000, immutable",
    etag,
    "last-modified": mtime.toUTCString(),
  };

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch) {
    if (ifNoneMatch.split(",").some((v) => v.trim().replace(/^W\//, "") === etag)) {
      return new Response(null, { status: 304, headers });
    }
  } else {
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (ifModifiedSince) {
      const since = Date.parse(ifModifiedSince);
      // mtime con precisión de segundos (los headers HTTP no llevan milisegundos).
      if (!Number.isNaN(since) && Math.floor(mtime.getTime() / 1000) * 1000 <= since) {
        return new Response(null, { status: 304, headers });
      }
    }
  }

  const buf = await readUpload(name);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers });
}
