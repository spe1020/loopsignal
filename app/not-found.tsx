import Link from "next/link";
import { Button } from "@/components/Button";
import { Container } from "@/components/Reveal";

export default function NotFound() {
  return (
    <section className="py-32">
      <Container>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          404
        </p>
        <h1 className="mt-5 text-4xl font-medium tracking-tight text-ink md:text-5xl">
          This page is not on the floor.
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-7 text-graphite">
          The page you are looking for does not exist. Start from home, or show
          us the process you want to improve.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/">Home</Button>
          <Link
            href="/loopscan"
            className="inline-flex items-center px-5 py-3 text-[13px] font-medium text-ink"
          >
            Talk to Us
          </Link>
        </div>
      </Container>
    </section>
  );
}
