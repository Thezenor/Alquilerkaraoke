import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { SignForm } from "./sign-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Firma de contrato · Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ContractSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contract = await prisma.contract.findUnique({ where: { token }, include: { booking: true } });
  if (!contract || contract.status === "CANCELLED") notFound();

  const b = contract.booking;
  const pdfHref = `/contrato/${token}/pdf`;
  const signed = contract.status === "SIGNED";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
        <span className="font-bold text-white">Alquiler Karaoke</span>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">Contrato de servicio</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Nº {contract.number} · {b.packName}
        {b.eventDate ? ` · ${b.eventDate.toLocaleDateString("es-ES")}` : ""}
      </p>

      {/* Resumen */}
      <dl className="mt-6 grid gap-3 rounded-xl border border-brand-border bg-brand-surface p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-brand-muted">Cliente</dt><dd className="text-white">{b.name}</dd></div>
        <div><dt className="text-brand-muted">Servicio</dt><dd className="text-white">{b.packName} · {b.hours} h</dd></div>
        <div><dt className="text-brand-muted">Total</dt><dd className="text-white">{formatCents(b.total)}</dd></div>
        <div><dt className="text-brand-muted">Reserva</dt><dd className="text-white">{formatCents(b.deposit)}</dd></div>
      </dl>

      {/* Condiciones */}
      <section className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-5">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Condiciones</h2>
        <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-brand-text">
          {contract.terms}
        </div>
      </section>

      {/* Firma */}
      <section className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-5">
        {signed ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
            <p className="font-semibold">Este contrato ya está firmado.</p>
            <p className="mt-1 text-sm">
              Firmado por {contract.signedName}
              {contract.signedAt ? ` el ${contract.signedAt.toLocaleString("es-ES")}` : ""}.
            </p>
            <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-emerald-300 underline">
              Descargar copia en PDF
            </a>
          </div>
        ) : (
          <SignForm token={token} pdfHref={pdfHref} />
        )}
      </section>

      <p className="mt-6 text-center text-xs text-brand-muted">
        Alquiler Karaoke · 607724965 · www.alquilerkaraoke.com
      </p>
    </main>
  );
}
