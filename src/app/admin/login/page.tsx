import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white">Alquiler Karaoke</h1>
          <p className="mt-1 text-sm text-slate-400">Panel de administración</p>
        </div>

        <Suspense fallback={<p className="text-center text-sm text-slate-400">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
