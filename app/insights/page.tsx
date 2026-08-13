import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { articles, insightTopics } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Writing on manufacturing operations, process improvement, procurement, supply chain, and practical use of AI in the plant.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Insights",
    description:
      "Writing on manufacturing operations, process improvement, procurement, supply chain, and practical use of AI in the plant.",
    url: "/insights",
  },
};

export default function InsightsPage() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <Reveal>
          <Eyebrow>Insights</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
            On work, systems, and improvement.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
            Practical writing for people who run plants, supply chains, and
            procurement — not a feed of product announcements.
          </p>
        </Reveal>

        <Reveal className="mt-12 flex flex-wrap gap-2" delay={80}>
          {insightTopics.map((topic) => (
            <span
              key={topic}
              className="border border-line px-3 py-1.5 text-[12px] text-graphite"
            >
              {topic}
            </span>
          ))}
        </Reveal>

        <div className="mt-16 divide-y divide-line border-y border-line">
          {articles.map((article, index) => (
            <Reveal key={article.slug} delay={index * 40}>
              <Link
                href={`/insights/${article.slug}`}
                className="grid gap-4 py-10 transition-colors hover:bg-paper/60 md:grid-cols-12 md:gap-8"
              >
                <div className="md:col-span-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper">
                    {article.category}
                  </p>
                  <p className="mt-2 text-sm text-stone">
                    {article.readTime}
                  </p>
                </div>
                <div className="md:col-span-9">
                  <h2 className="text-2xl font-medium tracking-tight text-ink md:text-[28px]">
                    {article.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-graphite">
                    {article.dek}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
