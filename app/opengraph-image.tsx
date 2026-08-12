import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f1eb",
          color: "#1b1a17",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          LoopWorks
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: -2,
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex" }}>Better systems.</div>
            <div style={{ display: "flex" }}>Better work.</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#6e6a63",
              maxWidth: 720,
            }}
          >
            Practical systems for manufacturers — process, automation, and AI
            that serve the work.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
