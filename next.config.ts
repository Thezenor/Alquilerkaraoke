import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Assets estáticos propios (logos, placeholders, iconos): cacheables en el navegador
// y revalidables en segundo plano. /_next/static ya lleva immutable de serie.
const staticAssetCache = {
  key: "Cache-Control",
  value: "public, max-age=86400, stale-while-revalidate=604800",
};

const nextConfig: NextConfig = {
  images: {
    // AVIF primero (más pequeño) con WebP de respaldo. Las imágenes de BD se
    // sirven same-origin desde /media/[...path], por lo que el loader por
    // defecto funciona sin remotePatterns.
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:file(.*\\.svg)", headers: [staticAssetCache] },
      { source: "/:file(icon-.*\\.png)", headers: [staticAssetCache] },
      { source: "/packs/:path*", headers: [staticAssetCache] },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
