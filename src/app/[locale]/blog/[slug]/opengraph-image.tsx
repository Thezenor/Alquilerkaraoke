import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/server/blog";

export const alt = "Blog · Alquiler Karaoke";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const title = post?.title ?? "Blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "radial-gradient(120% 120% at 30% 20%, #15202B 0%, #0B0E14 60%)",
          color: "#e9ebf5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 54,
              borderRadius: 20,
              background: "linear-gradient(180deg, #8FF4FB 0%, #22D3EE 45%, #0792AB 100%)",
              boxShadow: "0 0 24px rgba(34,211,238,0.5)",
              transform: "rotate(-12deg)",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
            Alquiler <span style={{ color: "#22D3EE", letterSpacing: 6 }}>KARAOKE</span>
          </span>
          <span style={{ marginLeft: 12, fontSize: 20, color: "#9aa1bd", letterSpacing: 4 }}>· BLOG</span>
        </div>

        <div style={{ fontSize: title.length > 70 ? 56 : 68, fontWeight: 800, lineHeight: 1.08, color: "#ffffff", maxWidth: 1040 }}>
          {title}
        </div>

        <div style={{ fontSize: 26, color: "#9aa1bd" }}>Karaoke y eventos profesionales en toda España</div>
      </div>
    ),
    { ...size },
  );
}
