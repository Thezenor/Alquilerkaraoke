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
          padding: "90px",
          background: "radial-gradient(120% 120% at 30% 25%, #15202B 0%, #0B0E14 60%)",
          color: "#e9ebf5",
          fontFamily: "sans-serif",
        }}
      >
        {/* Marca: mic + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 40 }}>
          {/* Micrófono estilizado */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-12deg)" }}>
            <div
              style={{
                width: 84,
                height: 110,
                borderRadius: 42,
                background: "linear-gradient(180deg, #8FF4FB 0%, #22D3EE 45%, #0792AB 100%)",
                boxShadow: "0 0 40px rgba(34,211,238,0.55)",
              }}
            />
            <div style={{ width: 26, height: 70, background: "#1b2128", borderRadius: 13, marginTop: -6 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>Alquiler</div>
            <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: 14, color: "#22D3EE", lineHeight: 1.1 }}>
              KARAOKE
            </div>
          </div>
        </div>

        <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000, color: "#ffffff" }}>
          No alquilamos una máquina: montamos una experiencia
        </div>
        <div style={{ fontSize: 28, color: "#9aa1bd", marginTop: 24 }}>
          Karaoke · Sonido · Iluminación · Eventos en toda España
        </div>
      </div>
    ),
    { ...size },
  );
}
