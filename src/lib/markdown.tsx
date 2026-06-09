import type { ReactNode } from "react";

// Renderizador de un subconjunto SEGURO de Markdown a elementos React.
// No usa dangerouslySetInnerHTML ni admite HTML embebido → sin riesgo de XSS.
// Soporta: # ## ### encabezados, listas "- ", **negrita**, [texto](url) y párrafos.

type Block =
  | { type: "h"; level: 2 | 3 | 4; text: string }
  | { type: "ul"; items: string[] }
  | { type: "img"; src: string; alt: string }
  | { type: "p"; text: string };

// Imagen de bloque: una línea que es solo ![alt](url)
const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list.slice() });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const img = IMG_RE.exec(line);
    if (img) {
      flushPara();
      flushList();
      const src = img[2];
      // Solo rutas relativas (/media/…) o http(s); descarta cualquier otra cosa.
      if (/^(https?:\/\/|\/)/i.test(src)) {
        blocks.push({ type: "img", src, alt: img[1].trim() });
      }
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = (h[1].length + 1) as 2 | 3 | 4; // # → h2, ## → h3, ### → h4
      blocks.push({ type: "h", level, text: h[2].trim() });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** Procesa inline: **negrita** y [texto](url) (solo http/https/mailto/relativas). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Primero enlaces, luego negrita dentro de los segmentos de texto.
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const pushText = (s: string) => {
    if (!s) return;
    // negrita
    const parts = s.split(/\*\*([^*]+)\*\*/g);
    parts.forEach((part, idx) => {
      if (!part) return;
      if (idx % 2 === 1) nodes.push(<strong key={`${keyPrefix}-b-${i++}`}>{part}</strong>);
      else nodes.push(part);
    });
  };
  while ((m = linkRe.exec(text)) !== null) {
    pushText(text.slice(last, m.index));
    const href = m[2];
    const safe = /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : "#";
    const external = /^https?:\/\//i.test(safe);
    nodes.push(
      <a
        key={`${keyPrefix}-a-${i++}`}
        href={safe}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-brand-neon underline"
      >
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return nodes;
}

/** Renderiza Markdown (subconjunto) como elementos React seguros. */
export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-4 leading-relaxed text-brand-muted">
      {blocks.map((b, i) => {
        if (b.type === "h") {
          const cls = b.level === 2 ? "text-2xl" : b.level === 3 ? "text-xl" : "text-lg";
          const Tag = (`h${b.level}` as unknown) as "h2" | "h3" | "h4";
          return (
            <Tag key={i} className={`${cls} font-semibold text-white`}>
              {renderInline(b.text, `h${i}`)}
            </Tag>
          );
        }
        if (b.type === "img") {
          return (
            <figure key={i} className="my-2 overflow-hidden rounded-xl border border-brand-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.src} alt={b.alt} loading="lazy" className="w-full" />
              {b.alt && <figcaption className="px-3 py-2 text-center text-xs text-brand-muted">{b.alt}</figcaption>}
            </figure>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="ml-5 list-disc space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, `li${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}

/** Texto plano a partir de Markdown (para excerpts y metadescripciones). */
export function markdownToPlain(md: string, max = 160): string {
  const plain = md
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,6}\s+/gm, "") // encabezados
    .replace(/^\s*[-*]\s+/gm, "") // viñetas de lista (solo al inicio de línea)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // imágenes → fuera
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // enlaces → texto
    .replace(/[*_`>#]/g, "") // marcas inline (no toca los guiones internos)
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}
