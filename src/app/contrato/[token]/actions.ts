"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { signContractByToken } from "@/server/contracts";
import { logAudit } from "@/server/audit";
import { rateLimit, isHoneypotFilled } from "@/server/rate-limit";

export type SignState = { status: "idle" | "signed" | "error"; message?: string };

const schema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  accept: z.literal("on"),
  // PNG dataURL opcional de la firma dibujada.
  signature: z.string().max(200_000).optional(),
});

export async function signContractAction(_prev: SignState, formData: FormData): Promise<SignState> {
  if (isHoneypotFilled(formData)) return { status: "signed" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Indica tu nombre completo y acepta las condiciones." };
  }
  const d = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;
  if (!rateLimit(`sign:${ip ?? "unknown"}`, 20)) {
    return { status: "error", message: "Demasiados intentos. Inténtalo más tarde." };
  }

  const signature = d.signature && d.signature.startsWith("data:image/png;base64,") ? d.signature : null;

  try {
    const res = await signContractByToken(d.token, { name: d.name, signatureImage: signature, ip, userAgent });
    if (!res.ok) return { status: "error", message: "El contrato no está disponible para firma." };
    await logAudit({ action: "contract.sign", entity: "Contract", metadata: { token: d.token.slice(0, 6) } });
    return { status: "signed" };
  } catch {
    return { status: "error", message: "No se pudo registrar la firma. Inténtalo de nuevo." };
  }
}
