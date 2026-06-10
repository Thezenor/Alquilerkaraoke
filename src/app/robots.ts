import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PRIVATE_PATHS = ["/admin", "/api", "/contrato"];

// Crawlers de IA permitidos explícitamente (GEO). Decisión en DECISIONS.md:
// queremos aparecer en respuestas de ChatGPT, Perplexity, Claude y Gemini.
const AI_BOTS = ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
