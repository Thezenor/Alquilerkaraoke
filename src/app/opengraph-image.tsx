import { ImageResponse } from "next/og";

export const alt = "Alquiler Karaoke — experiencias profesionales de karaoke y eventos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(120% 120% at 0% 0%, #0e2530 0%, #08090f 55%)",
          color: "#e9ebf5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#22d3ee",
              boxShadow: "0 0 30px #22d3ee",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>ALQUILER KARAOKE</div>
        </div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
          No alquilamos una máquina: montamos una experiencia
        </div>
        <div style={{ fontSize: 30, color: "#9aa1bd", marginTop: 28 }}>
          Karaoke · Sonido · Iluminación · Eventos en toda España
        </div>
      </div>
    ),
    { ...size },
  );
}
