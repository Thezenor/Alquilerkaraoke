import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { updateVat, updateZone } from "./actions";

export const metadata: Metadata = {
  title: "Tarifas · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export default async function TarifasPage() {
  const [config, zones] = await Promise.all([
    prisma.pricingConfig.findUnique({ where: { id: "default" } }),
    prisma.tariffZone.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { provinces: true } } },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Tarifas</h1>

      {/* IVA */}
      <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-semibold text-white">IVA</h2>
        <form action={updateVat} className="mt-4 flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vatPercent" className="text-sm text-brand-muted">Porcentaje de IVA (%)</label>
            <input id="vatPercent" name="vatPercent" type="number" min={0} max={100} defaultValue={config?.vatPercent ?? 21} className={inputClass} />
          </div>
          <button type="submit" className="rounded-full bg-brand-neon px-5 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
            Guardar
          </button>
        </form>
      </section>

      {/* Zonas tarifarias */}
      <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-semibold text-white">Zonas tarifarias</h2>
        <p className="mt-1 text-sm text-brand-muted">Suplemento por desplazamiento (€, sin IVA) que se aplica según la provincia del evento.</p>
        <ul className="mt-5 flex flex-col gap-3">
          {zones.map((z) => (
            <li key={z.id} className="rounded-xl border border-brand-border bg-brand-bg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-white">{z.name}</span>
                  <span className="ml-2 text-xs text-brand-muted">{z._count.provinces} provincias</span>
                  {z.pendingConfig && (
                    <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Pendiente de configurar</span>
                  )}
                </div>
              </div>
              <form action={updateZone} className="mt-3 flex items-end gap-3">
                <input type="hidden" name="id" value={z.id} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-brand-muted">Suplemento (€)</label>
                  <input name="supplement" type="number" step="0.01" defaultValue={centsToInput(z.supplement)} className={inputClass} />
                </div>
                <button type="submit" className="rounded-full border border-brand-border px-4 py-2.5 text-sm text-brand-text transition hover:border-brand-neon/60">
                  Guardar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
