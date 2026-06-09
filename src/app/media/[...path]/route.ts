import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

// Sirve los archivos subidos al Volume (/media/<archivo>). Solo .webp generados por saveImage.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const name = parts.join("/");
  if (!name.endsWith(".webp") || name.includes("/")) {
    return new Response("Not found", { status: 404 });
  }
  const buf = await readUpload(name);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
