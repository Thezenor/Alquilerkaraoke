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
import { deletePayment, generateContract, sendContract, cancelContract, sendQuoteAction, deleteBooking } from "../actions";
import { hasRole } from "@/lib/auth-roles";
import { CopyLink } from "./copy-link";
import { StatusBadge, PAYMENT_STATUS, PAYMENT_METHOD_LABELS, CONTRACT_STATUS } from "@/components/admin/status-badge";
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
type ActivitySnap = { packName?: string; name?: string; description?: string | null; hours?: number | null; extras?: ExtraSnap[]; lineTotal: number };

export default async function ReservaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; created?: string }>;
}) {
  const session = await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const canDelete = hasRole(session.user.roles, Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const sp = await searchParams;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { payments: { orderBy: { paidAt: "desc" } }, contract: true },
  });
  if (!b) notFound();

  const wa = waLink(b.phone);
  const extras = (b.extras ?? []) as ExtraSnap[];
  const activities = (b.activities ?? []) as ActivitySnap[];
  const pay = PAYMENT_STATUS[b.paymentStatus] ?? { tone: "neutral" as const, label: b.paymentStatus };
  const due = amountDue(b.amountPaid, b.total);
  const contract = b.contract;
  const contractSt = contract
    ? CONTRACT_STATUS[contract.status] ?? { tone: "neutral" as const, label: contract.status }
    : null;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.alquilerkaraoke.com").replace(/\/$/, "");

  return (
    <div>
      <Link href="/admin/reservas" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a reservas
      </Link>

      {sp.created === "quote" && (
        <p className="mt-4 rounded-lg border border-brand-neon/40 bg-brand-neon/10 px-4 py-2.5 text-sm text-brand-neon">
          Presupuesto creado. Descarga el PDF o envíalo al cliente desde los botones de abajo.
        </p>
      )}
      {sp.sent === "ok" && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          Presupuesto enviado al cliente por email.
        </p>
      )}
      {sp.sent === "skip" && (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          Email no configurado: añade una clave de Resend o Brevo para enviar. El PDF se puede descargar igualmente.
        </p>
      )}
      {sp.sent === "err" && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          No se pudo enviar el email del presupuesto. Inténtalo de nuevo o descarga el PDF.
        </p>
      )}

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
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Fecha · hora</dt>
              <dd className="mt-1 text-white">
                {b.eventDate ? b.eventDate.toLocaleDateString("es-ES") : "—"}
                {b.eventTime ? ` · ${b.eventTime}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Provincia · Horas</dt>
              <dd className="mt-1 text-white">{b.province || "—"} · {b.hours} h{b.night ? " · nocturno" : ""}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Asistentes</dt>
              <dd className="mt-1 text-white">{b.attendees ?? "—"}</dd>
            </div>
          </dl>

          {activities.length > 1 ? (
            <div className="mt-6">
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Actividades</dt>
              <ul className="mt-2 space-y-2">
                {activities.map((a, i) => (
                  <li key={i} className="rounded-lg border border-brand-border bg-brand-bg p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{a.name ?? a.packName ?? "—"}</span>
                      <div className="flex items-center gap-3 text-brand-muted">
                        {a.hours ? <span>{a.hours} h</span> : null}
                        <span>{formatCents(a.lineTotal)}</span>
                      </div>
                    </div>
                    {a.extras && a.extras.length > 0 && (
                      <p className="mt-1 text-xs text-brand-muted">
                        {a.extras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    {a.description && (
                      <p className="mt-1 whitespace-pre-line text-xs text-brand-muted">{a.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            extras.length > 0 && (
              <div className="mt-6">
                <dt className="text-xs uppercase tracking-wide text-brand-muted">Extras</dt>
                <ul className="mt-1 text-sm text-brand-text">
                  {extras.map((e, i) => (
                    <li key={i}>{e.name} — {formatCents(e.price)}</li>
                  ))}
                </ul>
              </div>
            )
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
              <div className="flex justify-between py-1 text-emerald-300">
                <span>Descuento{b.discountCode ? ` (código ${b.discountCode})` : " profesional"}</span>
                <span>−{formatCents(b.discount)}</span>
              </div>
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
            <a
              href={`/admin/reservas/${b.id}/proforma`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
            >
              <Icon name="box" className="h-4 w-4" />
              Proforma (PDF)
            </a>
            <a
              href={`/admin/reservas/${b.id}/presupuesto`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-neon/60 px-4 py-2 text-sm font-medium text-brand-neon transition hover:bg-brand-neon/10"
            >
              <Icon name="box" className="h-4 w-4" />
              Presupuesto (PDF premium)
            </a>
            <form action={sendQuoteAction}>
              <input type="hidden" name="bookingId" value={b.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
              >
                Enviar presupuesto
              </button>
            </form>
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

          {/* Contrato */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Contrato</h2>
              {contractSt && <StatusBadge tone={contractSt.tone}>{contractSt.label}</StatusBadge>}
            </div>

            {!contract ? (
              <>
                <p className="mt-1 mb-4 text-sm text-brand-muted">
                  Genera el contrato para poder enviarlo al cliente y que lo firme online.
                </p>
                <form action={generateContract}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-neon px-3 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
                  >
                    <Icon name="box" className="h-4 w-4" />
                    Generar contrato
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-brand-muted">
                  Nº <span className="text-brand-text">{contract.number}</span>
                  {contract.signedAt && (
                    <> · firmado el {contract.signedAt.toLocaleDateString("es-ES")} por{" "}
                      <span className="text-brand-text">{contract.signedName}</span></>
                  )}
                </p>

                {contract.status !== "SIGNED" && contract.status !== "CANCELLED" && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-brand-muted">Enlace de firma para el cliente</p>
                    <CopyLink url={`${siteUrl}/contrato/${contract.token}`} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/contrato/${contract.token}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
                  >
                    <Icon name="box" className="h-4 w-4" />
                    PDF del contrato
                  </a>

                  {contract.status !== "SIGNED" && contract.status !== "CANCELLED" && (
                    <form action={sendContract}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
                      >
                        {contract.status === "SENT" ? "Reenviar por email" : "Enviar por email"}
                      </button>
                    </form>
                  )}

                  {contract.status !== "SIGNED" && contract.status !== "CANCELLED" && (
                    <form action={cancelContract}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <ConfirmButton
                        confirmMessage="¿Anular este contrato?"
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Anular
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canDelete && (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-sm font-semibold text-red-300">Eliminar presupuesto / reserva</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Borra esta reserva y sus pagos y contrato asociados. Para conservar los importes por obligación
            contable, considera <strong className="text-brand-text">rechazarla</strong> en vez de eliminarla.
            <strong className="text-brand-text"> Esta acción no se puede deshacer.</strong>
          </p>
          <form action={deleteBooking} className="mt-3">
            <input type="hidden" name="id" value={b.id} />
            <ConfirmButton
              confirmMessage="¿Eliminar esta reserva/presupuesto y sus pagos y contrato? Esta acción no se puede deshacer."
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Eliminar definitivamente
            </ConfirmButton>
          </form>
        </div>
      )}
    </div>
  );
}
