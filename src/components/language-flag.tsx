import { flagFor } from "@/lib/song-languages";

// Banderas: emoji para la mayoría; SVG para los idiomas regionales que no tienen
// emoji (catalán, valenciano, gallego, euskera).

const box = "inline-block h-6 w-9 shrink-0 overflow-hidden rounded-sm shadow-sm";

function Catalan() {
  // Senyera: fondo amarillo con 4 franjas rojas.
  return (
    <svg viewBox="0 0 9 6" className={box} aria-hidden="true">
      <rect width="9" height="6" fill="#FCDD09" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} y={0.665 * (2 * i + 1)} width="9" height="0.665" fill="#DA121A" />
      ))}
    </svg>
  );
}

function Valencian() {
  // Senyera coronada: franjas + banda azul en el asta.
  return (
    <svg viewBox="0 0 9 6" className={box} aria-hidden="true">
      <rect width="9" height="6" fill="#FCDD09" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} y={0.665 * (2 * i + 1)} width="9" height="0.665" fill="#DA121A" />
      ))}
      <rect width="2.2" height="6" fill="#0050A0" />
    </svg>
  );
}

function Galician() {
  // Blanco con banda azul diagonal (esquina superior-asta a inferior-batiente).
  return (
    <svg viewBox="0 0 9 6" className={box} aria-hidden="true">
      <rect width="9" height="6" fill="#fff" />
      <path d="M0 0 L1.6 0 L9 4.8 L9 6 L7.4 6 L0 1.2 Z" fill="#0050A0" />
    </svg>
  );
}

function Basque() {
  // Ikurriña: fondo rojo, aspa verde y cruz blanca.
  return (
    <svg viewBox="0 0 9 6" className={box} aria-hidden="true">
      <rect width="9" height="6" fill="#D52B1E" />
      <path d="M0 0 L9 6 M9 0 L0 6" stroke="#009B48" strokeWidth="1" />
      <path d="M4.5 0 V6 M0 3 H9" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

export function LanguageFlag({ code, className }: { code: string; className?: string }) {
  switch (code) {
    case "CA":
      return <Catalan />;
    case "VL":
      return <Valencian />;
    case "GL":
      return <Galician />;
    case "EU":
      return <Basque />;
    default:
      return <span className={className ?? "text-2xl leading-none"}>{flagFor(code)}</span>;
  }
}
