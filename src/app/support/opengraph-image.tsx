import { ImageResponse } from "next/og";

export const alt = "Support Nexora — fund new episodes and new worlds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin text only: the bundled font has no Arabic glyphs. The page's own text carries the localized copy.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #03040c 0%, #2a1160 50%, #7c5cff 130%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 10, color: "#9fe8ff" }}>NEXORA</div>
        <div style={{ marginTop: 28, fontSize: 96, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>Support our stories</div>
        <div style={{ marginTop: 36, fontSize: 38, color: "#d6d0f5" }}>Fund new episodes and new worlds</div>
        <div style={{ marginTop: 56, display: "flex", fontSize: 30, color: "#fff", background: "rgba(255,255,255,.14)", padding: "14px 36px", borderRadius: 999 }}>
          From $5 · Any amount helps
        </div>
      </div>
    ),
    size,
  );
}
