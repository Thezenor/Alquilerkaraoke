import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { CustomerForm, type CustomerFormValues } from "../customer-form";
import { anonymizeCustomerAction } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { hasRole } from "@/lib/auth-roles";

export const metadata: Metadata = {
  title: "Editar cliente · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const canErase = hasRole(session.user.roles, Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!customer) notFound();

  const values: CustomerFormValues = {
    id: customer.id,
    email: customer.email,
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    isProfessional: customer.isProfessional,
    discountPercent: String(customer.discountPercent),
    notes: customer.notes ?? "",
  };

  return (
    <div>
      <Link href="/admin/clientes" className="text-sm text-brand-muted transition hover:text-white">← Volver a clientes</Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Editar: {customer.name || customer.email}</h1>
        <Link
          href={`/admin/clientes/presupuesto?customerId=${customer.id}`}
          className="shrink-0 rounded-full border border-brand-neon/60 px-4 py-2 text-sm font-semibold text-brand-neon transition hover:bg-brand-neon/10"
        >
          Crear presupuesto
        </Link>
      </div>
      <div className="mt-8"><CustomerForm values={values} /></div>

      {customer.bookings.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">Reservas del cliente</h2>
          <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
            {customer.bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/reservas/${b.id}`} className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-brand-surface-2">
                  <span className="text-brand-text">{b.packName} · {b.createdAt.toLocaleDateString("es-ES")}</span>
                  <span className="font-medium text-white">{formatCents(b.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canErase && (
        <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <h2 className="text-sm font-semibold text-red-300">Zona RGPD · Derecho de supresión</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Anonimiza los datos personales del cliente y de sus reservas. Se conservan los importes por
            obligación contable. <strong className="text-brand-text">Esta acción no se puede deshacer.</strong>
          </p>
          <form action={anonymizeCustomerAction} className="mt-3">
            <input type="hidden" name="id" value={customer.id} />
            <ConfirmButton
              confirmMessage="¿Anonimizar este cliente y la PII de sus reservas? Esta acción no se puede deshacer."
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Anonimizar datos personales
            </ConfirmButton>
          </form>
        </div>
      )}
    </div>
  );
}
