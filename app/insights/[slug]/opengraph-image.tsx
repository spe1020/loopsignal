import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/articles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.title ?? "LoopWorks Insights";
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
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#c24e1d",
          }}
        >
          LoopWorks Insights
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
              color: "#6e6a63",
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
