import { auth } from "@/server/auth";
import { canAccessAdmin } from "@/lib/auth-roles";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { buildQuoteCatalogPdf } from "@/server/pdf/quote-catalog";
import { quoteCatalogDataFromBooking } from "@/server/pdf/quote-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const data = quoteCatalogDataFromBooking(b, config);
  const bytes = await buildQuoteCatalogPdf(data);

  await logAudit({
    userId: session.user.id,
    action: "quote.download",
    entity: "Booking",
    entityId: b.id,
    metadata: { number: data.number },
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.number}.pdf"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
