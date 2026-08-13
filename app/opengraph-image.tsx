import { ImageResponse } from "next/og";
import {
  brand,
  LOOP_MARK_DOT,
  LOOP_MARK_PATH,
  LOOP_MARK_STROKE_WIDTH,
  LOOP_MARK_VIEWBOX,
} from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "LoopWorks — Better systems. Better work.";

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
          background: brand.paper,
          color: brand.charcoal,
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <svg
            width="96"
            height="48"
            viewBox={LOOP_MARK_VIEWBOX}
            fill="none"
          >
            <path
              d={LOOP_MARK_PATH}
              stroke={brand.charcoal}
              strokeWidth={LOOP_MARK_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={LOOP_MARK_DOT.cx}
              cy={LOOP_MARK_DOT.cy}
              r={LOOP_MARK_DOT.r}
              fill={brand.orange}
            />
          </svg>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: -0.6,
              }}
            >
              LoopWorks
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 13,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: brand.gray,
              }}
            >
              Better systems. Better work.
            </div>
          </div>
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
              color: brand.gray,
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
