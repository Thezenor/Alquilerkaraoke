import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Blog</h1>
        <Link
          href="/admin/blog/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nueva entrada
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="file-text" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay entradas. Crea la primera.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/blog/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{p.title}</p>
                  <p className="truncate text-sm text-brand-muted">
                    /{p.slug} · {p.locale.toUpperCase()}
                    {p.publishedAt ? ` · ${p.publishedAt.toLocaleDateString("es-ES")}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    p.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300",
                  )}
                >
                  {p.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
