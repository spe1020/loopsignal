import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Container } from "@/components/Reveal";
import { articles, getArticle } from "@/lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.dek,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <article className="py-20 md:py-28">
      <Container className="max-w-[760px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
          {article.category}
        </p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-graphite">{article.dek}</p>
        <p className="mt-6 text-sm text-stone">{article.readTime}</p>

        <div className="mt-14 space-y-8 border-t border-line pt-14">
          {article.blocks.map((block, index) => {
            if (block.type === "p") {
              return (
                <p key={index} className="text-[17px] leading-8 text-graphite">
                  {block.text}
                </p>
              );
            }
            if (block.type === "h2") {
              return (
                <h2
                  key={index}
                  className="pt-4 text-2xl font-medium tracking-tight text-ink"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote
                  key={index}
                  className="border-l-2 border-copper pl-6 font-serif text-2xl leading-snug text-ink"
                >
                  {block.text}
                </blockquote>
              );
            }
            return (
              <ul key={index} className="space-y-3">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-[16px] leading-7 text-graphite"
                  >
                    <span className="mt-3 h-px w-3 shrink-0 bg-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            );
          })}
        </div>

        <div className="mt-16 border-t border-line pt-12">
          <p className="font-serif text-2xl text-ink">
            Show us the process. We’ll help you make it better.
          </p>
          <div className="mt-6">
            <Button href="/loopscan">Find Your First Loop</Button>
          </div>
        </div>
      </Container>

      <Container className="mt-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
          More insights
        </p>
        <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/insights/${item.slug}`}
              className="bg-cream p-7 transition-colors hover:bg-paper"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-stone">
                {item.category}
              </p>
              <h2 className="mt-3 text-lg font-medium tracking-tight text-ink">
                {item.title}
              </h2>
            </Link>
          ))}
        </div>
      </Container>
    </article>
  );
}
