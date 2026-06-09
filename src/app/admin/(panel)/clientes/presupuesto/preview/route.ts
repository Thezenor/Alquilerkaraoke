import { auth } from "@/server/auth";
import { canAccessAdmin } from "@/lib/auth-roles";
import { prisma } from "@/lib/prisma";
import { computeQuoteFromForm } from "@/server/quote-input";
import { buildQuoteCatalogPdf } from "@/server/pdf/quote-catalog";
import { quoteCatalogDataFromInput } from "@/server/pdf/quote-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Genera el PDF del presupuesto AL VUELO desde el formulario, sin guardar nada. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    return new Response("No autorizado", { status: 403 });
  }

  const formData = await req.formData();
  const computed = await computeQuoteFromForm(formData, { requireCustomer: false });
  if (!computed.ok) return new Response(computed.message, { status: 400 });
  const { customer, date, province, eventTime, depositPercent, lines, breakdown } = computed.data;

  const config = await prisma.siteConfig.findUnique({ where: { id: "default" } });

  const data = quoteCatalogDataFromInput(
    {
      number: "BORRADOR",
      date: new Date().toLocaleDateString("es-ES"),
      customer: { name: customer.name || "Cliente", email: customer.email || null, phone: customer.phone || null },
      event: {
        eventDate: date ? new Date(`${date}T12:00:00`).toLocaleDateString("es-ES") : null,
        province,
        eventTime,
      },
      lines,
      amounts: {
        subtotal: breakdown.subtotal,
        vat: breakdown.vat,
        total: breakdown.total,
        deposit: breakdown.deposit,
        vatPercent: breakdown.subtotal > 0 ? Math.round((breakdown.vat * 100) / breakdown.taxableBase) : 21,
      },
      depositPercent,
      locale: "es",
    },
    config,
  );

  const bytes = await buildQuoteCatalogPdf(data);

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="presupuesto-borrador.pdf"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
