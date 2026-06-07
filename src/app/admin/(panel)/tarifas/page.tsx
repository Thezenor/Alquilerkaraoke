import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { updateVat, upsertSupplement, deleteSupplement } from "./actions";

export const metadata: Metadata = {
  title: "Tarifas · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export default async function TarifasPage() {
  const [config, supplements] = await Promise.all([
    prisma.pricingConfig.findUnique({ where: { id: "default" } }),
    prisma.provinceSupplement.findMany({ orderBy: { province: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Tarifas</h1>

      {/* IVA */}
      <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-semibold text-white">IVA</h2>
        <form action={updateVat} className="mt-4 flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vatPercent" className="text-sm text-brand-muted">
              Porcentaje de IVA (%)
            </label>
            <input
              id="vatPercent"
              name="vatPercent"
              type="number"
              min={0}
              max={100}
              defaultValue={config?.vatPercent ?? 21}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-neon px-5 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
          >
            Guardar
          </button>
        </form>
      </section>

      {/* Suplementos por provincia */}
      <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-semibold text-white">Suplementos por provincia</h2>
        <p className="mt-1 text-sm text-brand-muted">Cantidad fija (€, sin IVA) que se suma según la provincia.</p>

        <form action={upsertSupplement} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="province" className="text-sm text-brand-muted">Provincia</label>
            <input id="province" name="province" required placeholder="Madrid" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-sm text-brand-muted">Suplemento (€)</label>
            <input id="amount" name="amount" type="number" step="0.01" defaultValue="0" className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-full border border-brand-border px-5 py-2.5 text-brand-text transition hover:border-brand-neon/60"
          >
            Añadir / actualizar
          </button>
        </form>

        {supplements.length > 0 && (
          <ul className="mt-6 divide-y divide-brand-border">
            {supplements.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="text-brand-text">{s.province}</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-white">{formatCents(s.amount)}</span>
                  <form action={deleteSupplement}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="text-sm text-red-400 transition hover:text-red-300">
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
