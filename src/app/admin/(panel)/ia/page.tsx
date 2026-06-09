import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";
import { activateAiProvider } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IA · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const PROVIDER_LABEL: Record<string, string> = { ANTHROPIC: "Anthropic (Claude)", OPENAI: "OpenAI / compatible" };

export default async function AiProvidersPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const providers = await prisma.aiProvider.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inteligencia Artificial</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Proveedores para generar contenido (blog, servicios, ciudades, eventos). Añade los que quieras y elige el activo.
          </p>
        </div>
        <Link href="/admin/ia/nuevo" className="shrink-0 rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
          Añadir proveedor
        </Link>
      </div>

      {providers.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="cpu" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay proveedores de IA. Añade uno con su API key para activar la generación.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <Link href={`/admin/ia/${p.id}`} className="min-w-0 flex-1">
                <p className="font-medium text-white">{p.name}</p>
                <p className="truncate text-sm text-brand-muted">{PROVIDER_LABEL[p.provider] ?? p.provider} · {p.model}</p>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {p.isActive ? (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Activo</span>
                ) : (
                  <form action={activateAiProvider}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={cn("rounded-full border border-brand-border px-2.5 py-0.5 text-xs text-brand-muted transition hover:border-brand-neon/60 hover:text-white")}>
                      Activar
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-brand-muted">
        Las API keys se guardan en la base de datos y nunca se muestran de vuelta. Si no defines ningún proveedor, se usa la variable de entorno <code>ANTHROPIC_API_KEY</code> si existe.
      </p>
    </div>
  );
}
