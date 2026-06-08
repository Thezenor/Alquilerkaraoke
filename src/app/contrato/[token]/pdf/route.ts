import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { buildContractPdf, type ContractPdfData } from "@/server/pdf/contract";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PDF del contrato accesible con el token (secreto del enlace). Sin auth de admin.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`contract-pdf:${ip}`, 30)) {
    return new Response("Demasiadas solicitudes", { status: 429 });
  }
  const { token } = await params;
  const [contract, config] = await Promise.all([
    prisma.contract.findUnique({ where: { token }, include: { booking: true } }),
    prisma.siteConfig.findUnique({ where: { id: "default" } }),
  ]);
  if (!contract || contract.status === "CANCELLED") return new Response("No encontrado", { status: 404 });

  const b = contract.booking;
  const data: ContractPdfData = {
    number: contract.number,
    date: contract.createdAt.toLocaleDateString("es-ES"),
    company: {
      name: config?.companyName ?? "Alquiler Karaoke",
      legalName: config?.legalName,
      taxId: config?.taxId,
      address: config?.address,
      email: config?.email,
      phone: config?.phone ?? "607724965",
    },
    customer: { name: b.name, email: b.email, phone: b.phone },
    event: {
      packName: b.packName,
      eventDate: b.eventDate ? b.eventDate.toLocaleDateString("es-ES") : null,
      province: b.province,
      hours: b.hours,
      night: b.night,
    },
    total: b.total,
    deposit: b.deposit,
    terms: contract.terms,
    signed: contract.signedAt
      ? {
          name: contract.signedName ?? b.name,
          at: contract.signedAt.toLocaleString("es-ES"),
          ip: contract.signerIp,
          hash: contract.contentHash,
          image: contract.signatureImage,
        }
      : null,
  };

  const bytes = await buildContractPdf(data);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${contract.number}.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
