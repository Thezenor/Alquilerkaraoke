import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents, centsToInput } from "@/lib/money";
import { amountDue } from "@/lib/payments";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASSES } from "../status";
import { BookingForm } from "./booking-form";
import { PaymentForm } from "./payment-form";
import { deletePayment } from "../actions";
import { StatusBadge, PAYMENT_STATUS, PAYMENT_METHOD_LABELS } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Icon } from "@/components/admin/icons";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Reserva · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

function waLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length === 9 ? `34${digits}` : digits}`;
}

type ExtraSnap = { name: string; price: number };

export default async function ReservaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const { id } = await params;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { payments: { orderBy: { paidAt: "desc" } } },
  });
  if (!b) notFound();

  const wa = waLink(b.phone);
  const extras = (b.extras ?? []) as ExtraSnap[];
  const pay = PAYMENT_STATUS[b.paymentStatus] ?? { tone: "neutral" as const, label: b.paymentStatus };
  const due = amountDue(b.amountPaid, b.total);

  return (
    <div>
      <Link href="/admin/reservas" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a reservas
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{b.name} · {b.packName}</h1>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", BOOKING_STATUS_CLASSES[b.status])}>
            {BOOKING_STATUS_LABELS[b.status]}
          </span>
          <StatusBadge tone={pay.tone}>{pay.label}</StatusBadge>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Email</dt>
              <dd className="mt-1"><a href={`mailto:${b.email}`} className="text-white hover:text-brand-neon">{b.email}</a></dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Teléfono</dt>
              <dd className="mt-1 text-white">{b.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Fecha evento</dt>
              <dd className="mt-1 text-white">{b.eventDate ? b.eventDate.toLocaleDateString("es-ES") : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Provincia · Horas</dt>
              <dd className="mt-1 text-white">{b.province || "—"} · {b.hours} h{b.night ? " · nocturno" : ""}</dd>
            </div>
          </dl>

          {extras.length > 0 && (
            <div className="mt-6">
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Extras</dt>
              <ul className="mt-1 text-sm text-brand-text">
                {extras.map((e, i) => (
                  <li key={i}>{e.name} — {formatCents(e.price)}</li>
                ))}
              </ul>
            </div>
          )}

          {b.message && (
            <div className="mt-6">
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Mensaje</dt>
              <p className="mt-1 whitespace-pre-wrap text-brand-text">{b.message}</p>
            </div>
          )}

          {/* Importe (snapshot) */}
          <div className="mt-6 rounded-xl border border-brand-border bg-brand-bg p-4 text-sm">
            <div className="flex justify-between py-1 text-brand-muted"><span>Subtotal (sin IVA)</span><span>{formatCents(b.subtotal)}</span></div>
            {b.discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-300"><span>Descuento profesional</span><span>−{formatCents(b.discount)}</span></div>
            )}
            <div className="flex justify-between py-1 text-brand-muted"><span>IVA</span><span>{formatCents(b.vat)}</span></div>
            <div className="flex justify-between py-1 font-semibold text-white"><span>Total</span><span>{formatCents(b.total)}</span></div>
            <div className="flex justify-between py-1 text-brand-muted"><span>Reserva</span><span>{formatCents(b.deposit)}</span></div>
            {b.securityDeposit > 0 && (
              <div className="flex justify-between py-1 text-brand-muted"><span>Fianza</span><span>{formatCents(b.securityDeposit)}</span></div>
            )}
          </div>

          <p className="mt-4 text-xs text-brand-muted">
            Marketing: {b.marketingConsent ? "acepta publicidad" : "no acepta"}
            {b.consentVersion ? ` · consentimiento v${b.consentVersion}` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${b.email}`} className="rounded-full border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-neon/60">
              Email
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
            <h2 className="font-semibold text-white">Gestión</h2>
            <p className="mt-1 mb-5 text-sm text-brand-muted">Valida o rechaza la reserva y deja notas.</p>
            <BookingForm id={b.id} currentStatus={b.status} currentNote={b.adminNote ?? ""} />
          </div>

          {/* Pagos */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Pagos</h2>
              <StatusBadge tone={pay.tone}>{pay.label}</StatusBadge>
            </div>

            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-brand-muted"><dt>Total</dt><dd>{formatCents(b.total)}</dd></div>
              <div className="flex justify-between text-emerald-300"><dt>Cobrado</dt><dd>{formatCents(b.amountPaid)}</dd></div>
              <div className="flex justify-between font-semibold text-white"><dt>Pendiente</dt><dd>{formatCents(due)}</dd></div>
            </dl>

            {b.payments.length > 0 && (
              <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-lg border border-brand-border">
                {b.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 bg-brand-bg px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block text-brand-text">
                        {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </span>
                      <span className="text-xs text-brand-muted">{p.paidAt.toLocaleDateString("es-ES")}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn("font-medium", p.amount < 0 ? "text-amber-300" : "text-white")}>
                        {p.amount < 0 ? "−" : ""}{formatCents(Math.abs(p.amount))}
                      </span>
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton
                          confirmMessage="¿Eliminar este pago?"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-brand-muted transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </ConfirmButton>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <PaymentForm bookingId={b.id} defaultAmount={centsToInput(due > 0 ? due : b.deposit)} />
          </div>
        </div>
      </div>
    </div>
  );
}
