import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { PostForm, type PostFormValues } from "../post-form";
import { deletePost } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar entrada · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const { id } = await params;
  const p = await prisma.post.findUnique({ where: { id } });
  if (!p) notFound();

  const values: PostFormValues = {
    id: p.id,
    title: p.title,
    slug: p.slug,
    locale: p.locale,
    excerpt: p.excerpt ?? "",
    content: p.content,
    coverImageUrl: p.coverImageUrl ?? "",
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    status: p.status,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/blog" className="text-sm text-brand-muted transition hover:text-white">
          ← Volver al blog
        </Link>
        {p.status === "PUBLISHED" && (
          <a
            href={`/${p.locale}/blog/${p.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-neon underline"
          >
            Ver en la web ↗
          </a>
        )}
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {p.title}</h1>
      <div className="mt-8">
        <PostForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar entrada</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer.</p>
        <form action={deletePost} className="mt-3">
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar esta entrada del blog?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
