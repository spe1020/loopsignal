import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/articles";
import {
  brand,
  LOOP_MARK_DOT,
  LOOP_MARK_PATH,
  LOOP_MARK_STROKE_WIDTH,
  LOOP_MARK_VIEWBOX,
} from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.title ?? "LoopSignal Insights";
  const dek = article?.dek ?? "Practical writing on work, systems, and improvement.";

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
            gap: 16,
          }}
        >
          <svg
            width="72"
            height="36"
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
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: brand.orange,
            }}
          >
            LoopSignal Insights
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 48 ? 52 : 64,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              fontWeight: 500,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              lineHeight: 1.4,
              color: brand.gray,
              maxWidth: 820,
            }}
          >
            {dek}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
