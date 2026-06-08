import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alquiler Karaoke",
    short_name: "Alquiler Karaoke",
    description: "Alquiler de karaoke y eventos profesionales en toda España.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0E14",
    theme_color: "#0B0E14",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
