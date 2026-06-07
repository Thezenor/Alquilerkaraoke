"use client";

import { useActionState, useRef } from "react";
import { signContractAction, type SignState } from "./actions";

const initial: SignState = { status: "idle" };

export function SignForm({ token, pdfHref }: { token: string; pdfHref: string }) {
  const [state, formAction, pending] = useActionState(signContractAction, initial);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current!.getContext("2d")!;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0b0f14";
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn.current = true;
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current && sigInputRef.current) {
      sigInputRef.current.value = canvasRef.current!.toDataURL("image/png");
    }
  }
  function clear() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    hasDrawn.current = false;
    if (sigInputRef.current) sigInputRef.current.value = "";
  }

  if (state.status === "signed") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-200">
        <p className="font-semibold">Contrato firmado correctamente.</p>
        <p className="mt-1 text-sm">Gracias. Hemos registrado tu aceptación.</p>
        <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-emerald-300 underline">
          Descargar copia en PDF
        </a>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input ref={sigInputRef} type="hidden" name="signature" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Nombre y apellidos <span className="text-brand-neon">*</span></span>
        <input name="name" required minLength={3} maxLength={120} className={inputCls} />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Firma (opcional)</span>
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-40 w-full touch-none rounded-lg border border-brand-border bg-white"
        />
        <button type="button" onClick={clear} className="self-start text-xs text-brand-muted underline hover:text-white">
          Limpiar firma
        </button>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-brand-muted">
        <input type="checkbox" name="accept" required className="mt-0.5 h-4 w-4 accent-brand-neon" />
        <span>He leído y acepto las condiciones del contrato. Mi aceptación queda registrada con fecha, hora e IP.</span>
      </label>

      {state.status === "error" && <p role="alert" className="text-sm text-red-400">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-full bg-brand-neon px-6 py-3 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Firmando…" : "Firmar contrato"}
      </button>
    </form>
  );
}
