import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ProviderForm, type ProviderFormValues } from "../provider-form";

export const metadata: Metadata = {
  title: "Nuevo proveedor de IA · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: ProviderFormValues = {
  name: "",
  provider: "ANTHROPIC",
  model: "claude-sonnet-4-6",
  baseUrl: "",
  imageModel: "",
  isActive: true,
  hasKey: false,
};

export default async function NewAiProviderPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  return (
    <div>
      <Link href="/admin/ia" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a IA
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo proveedor de IA</h1>
      <p className="mt-1 text-sm text-brand-muted">Pega la API key de tu proveedor. Para Claude: clave que empieza por sk-ant-…</p>
      <div className="mt-8">
        <ProviderForm values={empty} />
      </div>
    </div>
  );
}
