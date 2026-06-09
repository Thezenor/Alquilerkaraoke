import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { saveImage } from "@/lib/uploads";
import { Role } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS)).user.id;
  } catch {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: "Petición no válida" }, { status: 400 });
  }
  if (!file) return Response.json({ error: "Falta el archivo" }, { status: 400 });

  try {
    const { url } = await saveImage(await file.arrayBuffer(), file.type || "image/*");
    await logAudit({ userId, action: "media.upload", entity: "Media", metadata: { url } });
    return Response.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const message =
      msg === "TOO_LARGE" ? "La imagen supera el límite de 15 MB." : msg === "INVALID_TYPE" ? "El archivo no es una imagen." : "No se pudo procesar la imagen.";
    return Response.json({ error: message }, { status: 400 });
  }
}
