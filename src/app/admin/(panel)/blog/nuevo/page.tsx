import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { PostForm, type PostFormValues } from "../post-form";

export const metadata: Metadata = {
  title: "Nueva entrada · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: PostFormValues = {
  title: "",
  slug: "",
  locale: "es",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  metaTitle: "",
  metaDescription: "",
  status: "DRAFT",
};

export default async function NewPostPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver al blog
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nueva entrada</h1>
      <div className="mt-8">
        <PostForm values={empty} />
      </div>
    </div>
  );
}
