import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, STATUS_CLASSES } from "../status";
import { RespondForm } from "./respond-form";

export const metadata: Metadata = {
  title: "Solicitud · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

function waLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length === 9 ? `34${digits}` : digits}`;
}

export default async function SolicitudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.contactRequest.findUnique({ where: { id } });
  if (!item) notFound();

  const wa = waLink(item.phone);

  return (
    <div>
      <Link href="/admin/solicitudes" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a solicitudes
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">{item.name}</h1>
        <span
          className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_CLASSES[item.status])}
        >
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Datos de la solicitud */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${item.email}`} className="text-white hover:text-brand-neon">
                  {item.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Teléfono</dt>
              <dd className="mt-1 text-white">{item.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Ciudad</dt>
              <dd className="mt-1 text-white">{item.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Recibida</dt>
              <dd className="mt-1 text-white">{item.createdAt.toLocaleString("es-ES")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Marketing</dt>
              <dd className="mt-1">
                {item.marketingConsent ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                    Acepta publicidad
                  </span>
                ) : (
                  <span className="text-brand-muted">No acepta</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-brand-muted">Consentimiento</dt>
              <dd className="mt-1 text-white">
                {item.acceptedTerms ? "Términos aceptados" : "—"}
                {item.consentVersion ? ` (v${item.consentVersion})` : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <dt className="text-xs uppercase tracking-wide text-brand-muted">Mensaje</dt>
            <p className="mt-2 whitespace-pre-wrap text-brand-text">{item.message}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`mailto:${item.email}`}
              className="rounded-full border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
            >
              Responder por email
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Responder por WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Gestión */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
          <h2 className="font-semibold text-white">Gestión</h2>
          <p className="mt-1 mb-5 text-sm text-brand-muted">
            Actualiza el estado y guarda la respuesta o notas internas.
          </p>
          <RespondForm
            id={item.id}
            currentStatus={item.status}
            currentResponse={item.response ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
