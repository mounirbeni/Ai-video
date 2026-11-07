import { ImageResponse } from "next/og";

export const alt = "Nexora — Stories Beyond Reality";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card for pages without their own artwork (home, pricing, ...). Latin text only:
// the bundled font has no Arabic glyphs, so title pages use their poster/backdrop instead.
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
          background: "linear-gradient(135deg, #03040c 0%, #1b1240 55%, #063a4a 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: 18 }}>NEXORA</div>
        <div style={{ marginTop: 18, fontSize: 40, color: "#9fe8ff", letterSpacing: 6 }}>STORIES BEYOND REALITY</div>
        <div style={{ marginTop: 56, fontSize: 28, color: "#c9c4e8" }}>Original movies & series</div>
      </div>
    ),
    size,
  );
}
