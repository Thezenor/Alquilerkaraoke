import { ImageResponse } from "next/og";
import { getServiceBySlug, localizedService } from "@/server/services";

export const alt = "Alquiler Karaoke";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ServiceOgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = await getServiceBySlug(slug);
  const name = service ? localizedService(service, locale).name : "Alquiler de karaoke y eventos";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "radial-gradient(120% 120% at 30% 25%, #15202B 0%, #0B0E14 60%)",
          color: "#e9ebf5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-12deg)" }}>
            <div
              style={{
                width: 54,
                height: 72,
                borderRadius: 27,
                background: "linear-gradient(180deg, #8FF4FB 0%, #22D3EE 45%, #0792AB 100%)",
                boxShadow: "0 0 28px rgba(34,211,238,0.55)",
              }}
            />
            <div style={{ width: 18, height: 46, background: "#1b2128", borderRadius: 9, marginTop: -4 }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: "#ffffff" }}>Alquiler</span>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 8, color: "#22D3EE" }}>KARAOKE</span>
          </div>
        </div>

        <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05, maxWidth: 1020, color: "#ffffff" }}>{name}</div>
        <div style={{ fontSize: 30, color: "#9aa1bd", marginTop: 28 }}>Eventos profesionales en toda España</div>
      </div>
    ),
    { ...size },
  );
}
