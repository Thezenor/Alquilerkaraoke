import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Registra un evento en AuditLog (best-effort: nunca debe romper la acción).
 * Captura IP y user-agent de la petición.
 */
export async function logAudit({ userId, action, entity, entityId, metadata }: AuditInput) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ip,
        userAgent,
      },
    });
  } catch {
    // ignorar errores de auditoría
  }
}
