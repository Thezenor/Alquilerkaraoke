import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTRACT_TERMS } from "@/lib/contract-terms";

/** Hash de integridad del contenido firmado (determinista). */
export function computeContentHash(parts: {
  number: string;
  terms: string;
  total: number;
  signedName: string;
  signedAtIso: string;
}): string {
  const canonical = [parts.number, parts.terms, String(parts.total), parts.signedName, parts.signedAtIso].join("\n");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/** Crea (o devuelve) el contrato de una reserva, con snapshot de las cláusulas. */
export async function createContractForBooking(bookingId: string, userId?: string) {
  const existing = await prisma.contract.findUnique({ where: { bookingId } });
  if (existing) return existing;

  const [booking, config] = await Promise.all([
    prisma.booking.findUnique({ where: { id: bookingId }, select: { id: true, createdAt: true } }),
    prisma.siteConfig.findUnique({ where: { id: "default" }, select: { contractTerms: true } }),
  ]);
  if (!booking) throw new Error("Reserva no encontrada");

  const number = `CON-${booking.createdAt.getFullYear()}-${booking.id.slice(-6).toUpperCase()}`;
  const terms = config?.contractTerms?.trim() || DEFAULT_CONTRACT_TERMS;
  const token = randomBytes(24).toString("base64url");

  return prisma.contract.create({
    data: { bookingId, number, terms, token, status: "DRAFT", createdById: userId ?? null },
  });
}

/** Registra la firma del cliente sobre un contrato (idempotente: no re-firma). */
export async function signContractByToken(
  token: string,
  input: { name: string; signatureImage?: string | null; ip?: string | null; userAgent?: string | null },
): Promise<{ ok: boolean; alreadySigned?: boolean }> {
  const contract = await prisma.contract.findUnique({
    where: { token },
    include: { booking: { select: { total: true } } },
  });
  if (!contract || contract.status === "CANCELLED") return { ok: false };
  if (contract.status === "SIGNED") return { ok: true, alreadySigned: true };

  const signedAt = new Date();
  const contentHash = computeContentHash({
    number: contract.number,
    terms: contract.terms,
    total: contract.booking.total,
    signedName: input.name,
    signedAtIso: signedAt.toISOString(),
  });

  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "SIGNED",
      signedName: input.name,
      signedAt,
      signerIp: input.ip ?? null,
      signerUserAgent: input.userAgent ?? null,
      signatureImage: input.signatureImage || null,
      contentHash,
    },
  });
  return { ok: true };
}
