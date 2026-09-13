import Link from "next/link";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({
  path: "/trust",
  title: "Trust and pilot readiness",
  description:
    "What the LoopSignal synthetic company evaluation demonstrates, and what remains before a paid pilot.",
});
export default function Trust() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-widest text-copper">
        Trust and pilot readiness
      </p>
      <h1 className="mt-5 text-4xl font-medium">
        Clear boundaries for company work.
      </h1>
      <div className="mt-9 space-y-7 text-base leading-8 text-graphite">
        <p>
          LoopSignal’s public example uses fictional records in a separate
          browser store. The company workspace is a distinct synthetic
          evaluation with shared storage and test-mode Team billing. Live
          subscriptions and real customer data are not enabled.
        </p>
        <h2 className="text-2xl text-ink">What has been checked locally</h2>
        <p>
          Local PostgreSQL tests exercise current membership, company isolation,
          role restrictions, revision conflicts, explicit reviews, private-file
          metadata policies, and subscription transitions. Separate browser
          sessions can complete an authored improvement through evidence,
          action, approval, closure, and approved learning. An isolated local
          restore includes database records and attachment bytes.
        </p>
        <h2 className="text-2xl text-ink">What remains before a paid pilot</h2>
        <p>
          Managed authentication and Storage API access must be tested against
          the actual provider. Hosted records and file recovery, backup access,
          region, retention scheduling, TLS and secret controls must be
          verified. Stripe test checkout and lifecycle checks must run against a
          test account. Independent security review is still required.
        </p>
        <h2 className="text-2xl text-ink">What an approval means</h2>
        <p>
          Company approval records an authorized signed-in reviewer’s decision
          about the current evidence and work. Material changes withdraw
          affected approval while preserving history. The application audit is
          protected from ordinary app edits; database operators still control
          the system. It is not a cryptographic signature, a tamper-proof
          record, or regulatory certification.
        </p>
        <p>
          Company pages suppress ordinary site analytics and do not persist a
          hidden browser copy of company records. Use an explicit recovery
          export before closing an unsaved editor. A provider outage shows
          unavailable rather than switching to local storage.
        </p>
        <p>
          <Link className="underline" href="/security">
            Data handling
          </Link>{" "}
          ·{" "}
          <Link className="underline" href="/privacy">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link className="underline" href="/company">
            Company test sign-in
          </Link>
        </p>
      </div>
    </section>
  );
}
