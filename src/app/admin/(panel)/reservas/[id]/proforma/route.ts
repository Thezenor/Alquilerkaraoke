import { auth } from "@/server/auth";
import { canAccessAdmin } from "@/lib/auth-roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { buildProformaPdf, type ProformaData } from "@/server/pdf/proforma";
import { PAYMENT_STATUS } from "@/components/admin/status-badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExtraSnap = { name: string; price: number };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return new Response("No autorizado", { status: 403 });
  }

  const { id } = await params;
  const [b, config] = await Promise.all([
    prisma.booking.findUnique({ where: { id } }),
    prisma.siteConfig.findUnique({ where: { id: "default" } }),
  ]);
  if (!b) return new Response("No encontrada", { status: 404 });

  const number = `PRE-${b.createdAt.getFullYear()}-${b.id.slice(-6).toUpperCase()}`;
  const extras = (b.extras ?? []) as ExtraSnap[];
  const activities = (b.activities ?? []) as { packName: string; hours: number; lineTotal: number }[];

  const data: ProformaData = {
    number,
    date: b.createdAt.toLocaleDateString("es-ES"),
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
    extras,
    amounts: {
      subtotal: b.subtotal,
      discount: b.discount,
      vat: b.vat,
      total: b.total,
      deposit: b.deposit,
      securityDeposit: b.securityDeposit,
      amountPaid: b.amountPaid,
    },
    payment: config ? { iban: config.iban, bizum: config.bizum, info: config.paymentInfo } : undefined,
    paymentStatusLabel: PAYMENT_STATUS[b.paymentStatus]?.label ?? b.paymentStatus,
    activities: activities.length > 1 ? activities.map((a) => ({ packName: a.packName, hours: a.hours, lineTotal: a.lineTotal })) : undefined,
  };

  const bytes = await buildProformaPdf(data);

  await logAudit({
    userId: session.user.id,
    action: "proforma.download",
    entity: "Booking",
    entityId: b.id,
    metadata: { number },
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${number}.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
