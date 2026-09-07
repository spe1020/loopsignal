import Link from "next/link";
import { LoopMark } from "@/components/Logo";

export default function Home() {
  return (
    <div className="product-home">
      <section className="product-hero">
        <div>
          <p className="product-eyebrow">
            Problem-solving software for manufacturing
          </p>
          <h1>
            Turn daily problems into improvements <em>that last.</em>
          </h1>
          <p className="product-intro">
            Keep the problem, the evidence, and the next action together. Give
            your team a clear path from “something’s wrong” to a result you can
            verify—and learning you can use again.
          </p>
          <div className="product-buttons">
            <Link className="product-button" href="/workspace">
              Try a live example <span aria-hidden="true">↗</span>
            </Link>
            <Link className="product-link" href="/pilot">
              Join the pilot →
            </Link>
          </div>
          <p className="product-caption">
            No sign-up · Fictional data · About 3 minutes
          </p>
        </div>
        <Link
          href="/workspace"
          className="hero-record"
          aria-label="Explore the bracket quality investigation"
        >
          <div className="hero-record-top">
            <LoopMark className="h-5 w-10" />
            <span>INSIDE LOOPSIGNAL</span>
            <span className="product-dot" />
          </div>
          <div className="hero-record-body">
            <p className="product-eyebrow">
              QUALITY / LS-001 · FICTIONAL EXAMPLE
            </p>
            <h2>
              The same defect.
              <br />A better investigation.
            </h2>
            <p>Oversized holes on the bracket line</p>
            <div className="hero-baseline">
              <div>
                <strong>24 / 400</strong>
                <span>parts rejected at baseline</span>
              </div>
              <div>
                <strong>≤ 1%</strong>
                <span>rejection-rate target</span>
              </div>
            </div>
            <ol className="hero-chain">
              <li>
                <span>01</span>
                <div>
                  <strong>Find the signal</strong>
                  <p>Compare the inspection log with the fixture check.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Act on the cause</strong>
                  <p>
                    Connect the countermeasure to what the evidence supports.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Prove it held</strong>
                  <p>
                    Review three follow-up lots. Retain the approved lesson.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <div className="hero-record-bottom">
            Open the working example <span aria-hidden="true">→</span>
          </div>
        </Link>
      </section>
      <section className="product-audience">
        <p>Built for the people keeping a plant moving.</p>
        <div>
          Quality <span>/</span> Continuous improvement <span>/</span>{" "}
          Procurement <span>/</span> Operations
        </div>
      </section>
      <section className="product-story" id="product">
        <div>
          <p className="product-eyebrow">One connected record</p>
          <h2>
            The reasoning stays
            <br />
            with the result.
          </h2>
          <p>
            When updates are scattered across email, spreadsheets, and meeting
            notes, the next shift inherits a status—not the story. LoopSignal
            connects what happened, what changed, and how you know it worked.
          </p>
        </div>
        <div className="product-features">
          {[
            [
              "01",
              "Problems with context",
              "Capture the baseline and inspect evidence. Keep a plausible explanation separate from an accepted cause.",
            ],
            [
              "02",
              "Actions with a reason",
              "See who owns the countermeasure and which cause it addresses. One action, the same state in every view.",
            ],
            [
              "03",
              "Results with proof",
              "Completed work is the start of verification. A result needs follow-up evidence before the loop can close.",
            ],
            [
              "04",
              "Learning worth keeping",
              "Retain an approved lesson with links back to its source. Reopen when new evidence changes the picture.",
            ],
          ].map(([n, title, body]) => (
            <div key={n}>
              <span>{n}</span>
              <section>
                <h3>{title}</h3>
                <p>{body}</p>
              </section>
            </div>
          ))}
        </div>
      </section>
      <section className="product-availability">
        <div>
          <p className="product-eyebrow">Available to explore today</p>
          <h2>Start with one real workflow.</h2>
          <p>
            The public example uses fictional records saved in this browser.
            Your existing LoopSolve investigations and LoopFlow maps remain
            device-local tools. Company accounts, shared storage, and
            subscriptions are the next milestone.
          </p>
          <div className="product-buttons">
            <Link className="product-button" href="/workspace">
              Try a live example →
            </Link>
            <Link className="product-link" href="/solve">
              Open your local investigations
            </Link>
          </div>
        </div>
        <aside>
          <h3>Optional help, when you need it.</h3>
          <p>
            LoopScan helps frame the problem. LoopBuild supports implementation
            and integration. LoopOps installs the sustainment method with the
            work.
          </p>
          <Link href="/services">
            Explore onboarding and integration help →
          </Link>
        </aside>
      </section>
    </div>
  );
}
