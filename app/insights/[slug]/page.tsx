import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { InsightViewTracker } from "@/components/InsightViewTracker";
import { Container } from "@/components/Reveal";
import {
  articleAnalyticsCategory,
  articles,
  formatArticleDate,
  getArticle,
  getRelatedArticles,
} from "@/lib/articles";
import { founder } from "@/lib/content";
import { siteUrl } from "@/lib/site";

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

  const title =
    article.seoTitle ?? `${article.title} | LoopWorks`;
  const description = article.seoDescription ?? article.dek;
  const url = `/insights/${article.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    authors: [{ name: article.author ?? founder.name, url: founder.linkedin }],
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "LoopWorks",
      locale: "en_US",
      publishedTime: `${article.date}T00:00:00.000Z`,
      authors: [article.author ?? founder.name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const author = article.author ?? founder.name;
  const related = getRelatedArticles(article);
  const canonical = `${siteUrl}/insights/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription ?? article.dek,
    datePublished: article.date,
    author: {
      "@type": "Person",
      name: author,
      url: founder.linkedin,
    },
    publisher: {
      "@type": "Organization",
      name: "LoopWorks",
      url: siteUrl,
    },
    mainEntityOfPage: canonical,
    url: canonical,
  };

  return (
    <article className="py-16 md:py-24">
      <InsightViewTracker
        slug={article.slug}
        category={articleAnalyticsCategory(article)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="max-w-[680px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          Insights
        </p>
        <h1 className="mt-5 text-[2rem] font-medium leading-[1.12] tracking-[-0.035em] text-ink sm:text-4xl md:text-[2.75rem]">
          {article.title}
        </h1>
        <p className="mt-6 text-[17px] leading-8 text-graphite md:text-lg">
          {article.dek}
        </p>
        <p className="mt-8 text-[13px] leading-6 text-stone">
          {author}
          <span className="mx-2 text-stone/40" aria-hidden>
            ·
          </span>
          {formatArticleDate(article.date)}
          <span className="mx-2 text-stone/40" aria-hidden>
            ·
          </span>
          {article.readTime} read
        </p>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-stone">
          {article.kicker ?? article.category}
        </p>

        <div className="mt-12 space-y-7 border-t border-line pt-12 md:mt-14 md:space-y-8 md:pt-14">
          {article.blocks.map((block, index) => {
            if (block.type === "p") {
              return (
                <p
                  key={index}
                  className="text-[17px] leading-[1.8] text-graphite md:text-[18px] md:leading-[1.85]"
                >
                  {block.text}
                </p>
              );
            }
            if (block.type === "h2") {
              return (
                <h2
                  key={index}
                  className="border-t border-line pt-10 text-[1.35rem] font-medium tracking-tight text-ink md:pt-12 md:text-[1.65rem]"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote
                  key={index}
                  className="border-l-2 border-copper py-1 pl-5 font-serif text-[1.25rem] leading-snug text-ink md:pl-6 md:text-[1.5rem]"
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
                    className="flex gap-3 text-[16px] leading-7 text-graphite md:text-[17px] md:leading-8"
                  >
                    <span className="mt-3.5 h-px w-3 shrink-0 bg-copper" />
                    {item}
                  </li>
                ))}
              </ul>
            );
          })}
        </div>

        <aside className="mt-14 border-t border-line pt-10 md:mt-16">
          <h2 className="text-lg font-medium tracking-tight text-ink">
            About the author
          </h2>
          <div className="mt-6 flex gap-5">
            <div className="relative h-[88px] w-[72px] shrink-0 overflow-hidden">
              <Image
                src="/images/gemba.jpg"
                alt={`${author}, founder of LoopWorks`}
                fill
                className="object-cover"
                sizes="72px"
              />
              <div className="absolute inset-0 bg-ink/50" />
              <p className="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] tracking-[0.18em] text-copper">
                SS
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] leading-7 text-graphite">
                {author} is the founder of LoopWorks and a manufacturing and
                supply chain leader with experience across procurement,
                operations, supplier development, production planning,
                continuous improvement, and manufacturing engineering.
              </p>
              <p className="mt-3 text-[15px] leading-7 text-graphite">
                LoopWorks helps manufacturers find operational friction and
                build better systems using process improvement, automation, and
                AI.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium">
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-copper hover:text-copper-dark"
                >
                  LinkedIn
                </a>
                <Link href="/" className="text-copper hover:text-copper-dark">
                  LoopWorks
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="mt-14 border-t border-line pt-10 md:mt-16 md:pt-12">
          <h2 className="text-2xl font-medium tracking-tight text-ink md:text-[28px]">
            What process does your team hate doing?
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-graphite">
            If a process takes too long, requires repetitive work, depends on
            scattered information, or repeatedly creates problems, it may be a
            good place to start.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button
              href="/loopscan"
              location="article"
              articleSlug={article.slug}
            >
              Find Your First Loop
            </Button>
            <Button
              href="/loopscan"
              variant="text"
              location="article"
              articleSlug={article.slug}
            >
              Learn about LoopScan
            </Button>
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <Container className="mt-20 md:mt-24">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
            Keep reading
          </h2>
          <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/insights/${item.slug}`}
                className="bg-cream p-6 transition-colors hover:bg-paper md:p-7"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-stone">
                  {item.category}
                </p>
                <h3 className="mt-3 text-lg font-medium tracking-tight text-ink">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </Container>
      ) : null}
    </article>
  );
}
