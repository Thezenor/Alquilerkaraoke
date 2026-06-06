import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { canAccessAdmin } from "@/lib/auth-roles";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Container } from "@/components/ui/container";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Defensa en profundidad: además del middleware, verificamos en servidor.
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border bg-brand-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            <span className="font-bold text-white">Alquiler Karaoke</span>
            <span className="hidden text-xs text-brand-muted sm:inline">· Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-brand-muted sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </Container>
      </header>

      <div className="border-b border-brand-border bg-brand-bg">
        <Container className="py-2">
          <AdminNav />
        </Container>
      </div>

      <main>
        <Container className="py-8">{children}</Container>
      </main>
    </div>
  );
}
