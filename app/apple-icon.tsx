import { ImageResponse } from "next/og";
import {
  brand,
  LOOP_MARK_DOT,
  LOOP_MARK_PATH,
  LOOP_MARK_STROKE_WIDTH,
  LOOP_MARK_VIEWBOX,
} from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.charcoal,
        }}
      >
        <svg
          width="136"
          height="68"
          viewBox={LOOP_MARK_VIEWBOX}
          fill="none"
        >
          <path
            d={LOOP_MARK_PATH}
            stroke="#FFFFFF"
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
      </div>
    ),
    size,
  );
}
