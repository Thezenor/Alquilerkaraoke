import { getContact } from "@/server/site-config";
import { getActiveServices } from "@/server/services";
import { getActivePacks } from "@/server/packs";
import { getActiveCities } from "@/server/cities";
import { formatCents } from "@/lib/money";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

// Lee BD (capas cacheadas por tag): no se puede prerenderizar en build
// (el build de Railway corre antes de `migrate deploy`). El CDN cachea
// vía Cache-Control.
export const dynamic = "force-dynamic";

/**
 * GEO (Generative Engine Optimization): /llms.txt en markdown para agentes y
 * buscadores con IA (ChatGPT, Perplexity, Claude, Gemini…). Generado desde la
 * BD para no divergir del contenido real. Decisión en DECISIONS.md (bots IA permitidos).
 */
export async function GET() {
  const [contact, services, packs, cities] = await Promise.all([
    getContact(),
    getActiveServices(),
    getActivePacks(),
    getActiveCities(),
  ]);

  const lines: string[] = [
    `# ${contact.companyName || SITE_NAME}`,
    "",
    "> Alquiler profesional de karaoke y eventos en España. No alquilamos solo una máquina:",
    "> montamos una experiencia profesional de karaoke y eventos para particulares, empresas,",
    "> bodas, fiestas y acciones de marca. Equipos profesionales (pantallas, micrófonos",
    "> inalámbricos, sonido e iluminación) y un catálogo de más de 180.000 canciones.",
    "",
    `- Teléfono: +34 ${contact.phone}`,
    ...(contact.email ? [`- Email: ${contact.email}`] : []),
    `- Web: ${absoluteUrl("/es")}`,
    `- Idiomas de la web: español (/es), inglés (/en), francés (/fr)`,
    "",
  ];

  if (services.length > 0) {
    lines.push("## Servicios", "");
    for (const s of services) {
      const desc = s.shortDescription ? `: ${s.shortDescription}` : "";
      lines.push(`- [${s.name}](${absoluteUrl(`/es/servicios/${s.slug}`)})${desc}`);
    }
    lines.push("");
  }

  if (packs.length > 0) {
    lines.push("## Packs y precios", "", "Precios públicos «desde», sin IVA.", "");
    for (const p of packs) {
      const price = `desde ${formatCents(p.basePrice)} + IVA${p.isPerDay ? " (por día)" : ""}`;
      const desc = p.shortDescription ? ` — ${p.shortDescription}` : "";
      lines.push(`- [${p.name}](${absoluteUrl(`/es/packs/${p.slug}`)}): ${price}${desc}`);
    }
    lines.push("");
  }

  if (cities.length > 0) {
    lines.push(
      "## Cobertura",
      "",
      "Servicio en toda España, con landings dedicadas en:",
      "",
      ...cities.map((c) => `- [${c.name}](${absoluteUrl(`/es/karaoke/${c.slug}`)})`),
      "",
    );
  }

  lines.push(
    "## Enlaces útiles",
    "",
    `- [Preguntas frecuentes](${absoluteUrl("/es/faq")})`,
    `- [Packs y precios](${absoluteUrl("/es/packs")})`,
    `- [Pedir presupuesto](${absoluteUrl("/es/presupuesto")})`,
    `- [Catálogo de canciones](${absoluteUrl("/es/canciones")})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
