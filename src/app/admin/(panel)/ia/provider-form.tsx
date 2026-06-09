"use client";

import { useActionState, useState, useTransition } from "react";
import { saveAiProvider, testAiProvider, type AiFormState } from "./actions";

const initial: AiFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type ProviderFormValues = {
  id?: string;
  name: string;
  provider: "ANTHROPIC" | "OPENAI";
  model: string;
  baseUrl: string;
  imageModel: string;
  isActive: boolean;
  hasKey: boolean;
};

export function ProviderForm({ values }: { values: ProviderFormValues }) {
  const [state, formAction, pending] = useActionState(saveAiProvider, initial);
  const [provider, setProvider] = useState(values.provider);
  const [testPending, startTest] = useTransition();
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const modelHint = provider === "OPENAI" ? "p. ej. gpt-4o-mini" : "p. ej. claude-sonnet-4-6";

  function handleTest() {
    if (!values.id) return;
    setTestMsg(null);
    startTest(async () => {
      const res = await testAiProvider(values.id!);
      setTestMsg({ ok: res.ok, text: res.message });
    });
  }

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
          <input name="name" required maxLength={100} defaultValue={values.name} placeholder="Claude (principal)" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Proveedor</span>
          <select name="provider" value={provider} onChange={(e) => setProvider(e.target.value as "ANTHROPIC" | "OPENAI")} className={inputClass}>
            <option value="ANTHROPIC">Anthropic (Claude)</option>
            <option value="OPENAI">OpenAI / compatible</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Modelo <span className="text-brand-neon">*</span></span>
          <input name="model" required maxLength={120} defaultValue={values.model} placeholder={modelHint} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">API key {values.hasKey ? "" : <span className="text-brand-neon">*</span>}</span>
          <input name="apiKey" type="password" autoComplete="off" maxLength={300} placeholder={values.hasKey ? "•••••••• (sin cambios)" : "sk-…"} className={inputClass} />
        </label>
        {provider === "OPENAI" && (
          <>
            <label className="sm:col-span-2 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-brand-text">URL base (opcional, para compatibles)</span>
              <input name="baseUrl" maxLength={300} defaultValue={values.baseUrl} placeholder="https://api.openai.com/v1 (o OpenRouter, Groq…)" className={inputClass} />
              <span className="text-xs text-brand-muted">Déjalo vacío para OpenAI. Para otros compatibles, pon su endpoint /v1.</span>
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-brand-text">Modelo de imágenes (opcional)</span>
              <input name="imageModel" maxLength={120} defaultValue={values.imageModel} placeholder="gpt-image-1 o dall-e-3" className={inputClass} />
              <span className="text-xs text-brand-muted">Si lo rellenas, este proveedor podrá generar imágenes para el blog.</span>
            </label>
          </>
        )}
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" /> Usar este proveedor (activo)
      </label>

      {state.status === "error" && state.message && <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {values.id && (
          <button type="button" onClick={handleTest} disabled={testPending} className="rounded-full border border-brand-border px-5 py-2.5 text-sm font-medium text-brand-text transition hover:border-brand-neon/60 disabled:opacity-60">
            {testPending ? "Probando…" : "Probar conexión"}
          </button>
        )}
      </div>
      {testMsg && <p className={`mt-3 text-sm ${testMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{testMsg.text}</p>}
    </form>
  );
}
