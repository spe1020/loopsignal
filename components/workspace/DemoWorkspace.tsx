"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { createDocumentContext } from "@/components/loop/DocumentProvider";
import { downloadText } from "@/lib/loop/download";
import { orderedSteps } from "@/lib/flow/metrics";
import { isVerifiedImprovement, latestVerification } from "@/lib/solve/rules";
import type { VerificationResult } from "@/lib/solve/schema";
import {
  createDemo,
  ids,
  milestones,
  observationMetrics,
  owners,
  reduceDemo,
  verificationBlockers,
  type Demo,
  type DemoCommand,
} from "@/lib/workspace/demo";
import { demoStore, loadDemo } from "@/lib/workspace/storage";

const ctx = createDocumentContext<Demo, DemoCommand>({
  name: "Demo",
  saveOnLoad: true,
  reduce: reduceDemo,
  load: loadDemo,
  save: demoStore.save,
  kind: demoStore.kind,
  replace: (doc) => ({ type: "replace", doc }),
});
type View = "Problems" | "Actions" | "Results" | "Lessons";
const views: View[] = ["Problems", "Actions", "Results", "Lessons"];
const viewIcons = ["◎", "↗", "◷", "▤"];
const actionLabels = {
  open: "Open",
  in_progress: "In progress",
  ready_for_verification: "Ready for verification",
  complete: "Complete",
};
const resultLabels = {
  effective: "Effective",
  monitoring: "Monitoring",
  partially_effective: "Partially effective",
  not_effective: "Not effective",
};

export function DemoWorkspace() {
  return (
    <ctx.Provider
      id="manufacturing-preview"
      fallback={
        <div className="workspace-loading" role="status">
          Opening the fictional example…
        </div>
      }
      missing={
        <div className="workspace-loading">
          Example unavailable. <Link href="/">Return home</Link>
        </div>
      }
    >
      <Workspace />
    </ctx.Provider>
  );
}
function Workspace() {
  const { doc, dispatch, restore, savedAt, saving, dirty, flush, storageKind } =
    ctx.useDocument();
  const [view, setView] = useState<View>("Problems");
  const [outcome, setOutcome] = useState<VerificationResult>("monitoring");
  const [notice, setNotice] = useState("");
  const [replayConfirm, setReplayConfirm] = useState(false);
  const inv = doc.investigation;
  const action = inv.actions.find((a) => a.id === ids.action)!;
  const cause = inv.causes.find((c) => c.id === ids.cause)!;
  const progress = milestones(doc);
  const observations = observationMetrics(doc);
  const verified = isVerifiedImprovement(inv);
  const verification = latestVerification(inv, ids.action);
  const linked = action.linkedCauseIds.includes(cause.id);
  const readyForCause = [ids.baseline, ids.fixture, ids.material].every((id) =>
    doc.reviewedEvidenceIds.includes(id),
  );
  const blockers = verificationBlockers(doc);
  const lesson = inv.lessons.find((l) => l.id === ids.lesson);
  const status = verified
    ? "Verified improvement"
    : inv.status === "reopened"
      ? "Reopened · review needed"
      : verification
        ? resultLabels[verification.result]
        : action.status === "complete"
          ? "Ready for verification"
          : "Investigation open";
  function go(next: View) {
    setView(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function send(command: DemoCommand, message: string) {
    dispatch(command);
    setNotice(message);
  }
  function replay() {
    restore(createDemo());
    setView("Problems");
    setOutcome("monitoring");
    setReplayConfirm(false);
    setNotice(
      "Demo restarted. Your local investigations and maps are untouched.",
    );
  }
  const next = !progress[0].complete
    ? {
        view: "Problems" as View,
        label: "Review the three source records",
        text: "Start with the baseline, fixture trial, and material check. Then decide which explanation the evidence supports.",
      }
    : !linked || action.status !== "complete"
      ? {
          view: "Actions" as View,
          label: "Connect and complete the countermeasure",
          text: "Link the supported cause, assign a fictional owner, and review the supplied completion record.",
        }
      : !verified
        ? {
            view: "Results" as View,
            label: "Verify across the observation window",
            text: "Inspect all three follow-up lots before approving the demo result. Completion alone earns no verified milestone.",
          }
        : !progress[3].complete
          ? {
              view: "Lessons" as View,
              label: "Retain the approved learning",
              text: "Keep the lesson with its source verification so the next team can see why it was accepted.",
            }
          : {
              view: "Lessons" as View,
              label: "One improvement, with its reasoning intact",
              text: "The demo is complete. New evidence can reopen the investigation without losing the work.",
            };

  return (
    <div className="signal-workspace">
      <header className="workspace-top">
        <Logo />
        <div className="workspace-top-label">
          PRODUCT PREVIEW <span>/</span> NORTHFIELD WORKS
        </div>
        <Link href="/pilot" className="workspace-pilot">
          Join the pilot ↗
        </Link>
      </header>
      <div className="workspace-demo-bar">
        <span>
          <b>Fictional example</b>{" "}
          <span className="demo-bar-detail">
            · About 3 minutes · No account needed
          </span>
        </span>
        <span>
          {storageKind === "memory"
            ? "This tab only · export before leaving"
            : "Stored in this browser only"}
        </span>
      </div>
      <div className="workspace-layout">
        <aside className="workspace-sidebar">
          <div className="workspace-site">
            <span className="workspace-avatar">NW</span>
            <div>
              <strong>Northfield Works</strong>
              <span>Manufacturing · Demo</span>
            </div>
          </div>
          <p className="workspace-nav-label">WORKSPACE</p>
          <nav aria-label="Workspace views">
            {views.map((item, i) => (
              <button
                type="button"
                aria-current={view === item ? "page" : undefined}
                key={item}
                onClick={() => go(item)}
              >
                <span aria-hidden="true">{viewIcons[i]}</span>
                {item}
                <small>
                  {item === "Lessons"
                    ? inv.lessons.length
                    : item === "Results"
                      ? inv.verifications.length
                      : 1}
                </small>
              </button>
            ))}
          </nav>
          <div className="workspace-sidebar-bottom">
            <p>Your own work</p>
            <Link href="/solve">Local investigations ↗</Link>
            <Link href="/flow">Local process maps ↗</Link>
            <span>
              Individual tools on this device.
              <br />
              No company cloud sync.
            </span>
          </div>
        </aside>
        <div className="workspace-main">
          <div className="workspace-breadcrumb">
            Workspace <span>/</span> {view} <span>/</span> LS-001
          </div>
          <div className="workspace-heading">
            <div>
              <p className="product-eyebrow">QUALITY · CELL 3 · BR-104</p>
              <h1>
                {view === "Problems"
                  ? inv.title
                  : view === "Actions"
                    ? "A countermeasure with a cause."
                    : view === "Results"
                      ? "Did the improvement hold?"
                      : "Keep what the team learned."}
              </h1>
              <div className="workspace-meta">
                <span
                  className={`workspace-badge ${verified ? "is-good" : ""}`}
                  data-testid="problem-status"
                >
                  {status}
                </span>
                <span>Alex Morgan · Quality lead</span>
                <span>Opened 3 Aug 2026</span>
              </div>
            </div>
          </div>
          <div className="workspace-save-row">
            <span role="status">
              {saving
                ? "Saving…"
                : dirty
                  ? "Unsaved changes · keep this page open"
                  : savedAt
                    ? "Saved in this browser"
                    : "Not saved"}
            </span>
            <button
              onClick={() => {
                downloadText(
                  "LoopSignal-fictional-example.json",
                  JSON.stringify(doc, null, 2),
                );
                setNotice(
                  "Exported the current demo snapshot, including any unsaved edits. Keep the JSON as a readable recovery copy.",
                );
              }}
            >
              Export demo ↓
            </button>
            <button
              onClick={() => setReplayConfirm(!replayConfirm)}
              aria-expanded={replayConfirm}
            >
              Replay demo ↺
            </button>
            {dirty && !saving ? (
              <button onClick={() => void flush()}>Save now</button>
            ) : null}
          </div>
          {replayConfirm ? (
            <div className="workspace-notice">
              <p>
                Restart this fictional example? This replaces only demo progress
                in this browser. Your LoopSolve documents and LoopFlow maps stay
                intact.
              </p>
              <div className="product-buttons">
                <button
                  className="workspace-secondary"
                  onClick={() => setReplayConfirm(false)}
                >
                  Keep exploring
                </button>
                <button className="product-button" onClick={replay}>
                  Restart fictional example
                </button>
              </div>
            </div>
          ) : null}
          {notice ? (
            <p className="workspace-notice" role="status">
              {notice}
            </p>
          ) : null}
          <div className="workspace-content">
            <div className="workspace-primary">
              {view === "Problems" ? (
                <>
                  <section className="workspace-card">
                    <div className="workspace-section-heading">
                      <span className="workspace-step">01</span>
                      <h2>Start with what happened.</h2>
                    </div>
                    <p className="workspace-lead">
                      {inv.problem.generatedStatement}
                    </p>
                    <a className="workspace-text-button" href="#demo-evidence">
                      Inspect the source evidence ↓
                    </a>
                    <div className="workspace-numbers">
                      <div>
                        <strong>
                          {observations.baseline?.rate ?? "—"}
                          <span>%</span>
                        </strong>
                        <span>Baseline rejection rate</span>
                        <small>
                          {observations.baseline?.rejected} of{" "}
                          {observations.baseline?.inspected} parts · Lot B-803
                        </small>
                      </div>
                      <div>
                        <strong>
                          ≤1<span>%</span>
                        </strong>
                        <span>Required result</span>
                        <small>Each follow-up lot, across shifts</small>
                      </div>
                    </div>
                    <div className="workspace-containment">
                      <span aria-hidden="true">✓</span>
                      <p>
                        <b>Containment verified in the example</b>
                        <br />
                        Baseline lot held and sorted; 24 rejects segregated.
                      </p>
                    </div>
                    <details className="workspace-process">
                      <summary>
                        See where this happened · LoopFlow process
                      </summary>
                      <ol>
                        {orderedSteps(doc.map.versions.current).map((step) => (
                          <li
                            key={step.id}
                            className={
                              step.id === inv.source?.stepId ? "is-focus" : ""
                            }
                          >
                            <span>{step.order + 1}</span>
                            <b>{step.name}</b>
                            {step.id === inv.source?.stepId ? (
                              <small>
                                LS-001 · Action {actionLabels[action.status]}
                              </small>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                      <p>
                        Process context uses the same linked investigation and
                        action. Step times have not been measured in this
                        example.
                      </p>
                    </details>
                  </section>
                  <section className="workspace-card" id="demo-evidence">
                    <div className="workspace-section-heading">
                      <span className="workspace-step">02</span>
                      <h2>Evidence before explanation.</h2>
                    </div>
                    <p className="workspace-muted">
                      Open each record, read its source passage, and mark it
                      reviewed. The controlled trial supports a cause; it does
                      not prove a lasting result.
                    </p>
                    <EvidenceCard id={ids.baseline} />
                    <EvidenceCard id={ids.fixture} />
                    <EvidenceCard id={ids.material} />
                    <div
                      className={`workspace-cause ${progress[0].complete ? "is-supported" : ""}`}
                    >
                      <p className="product-eyebrow">
                        {progress[0].complete
                          ? "ACCEPTED ROOT CAUSE · SUPPORTED"
                          : "HYPOTHESIS · NEEDS YOUR REVIEW"}
                      </p>
                      <h3>{cause.text}</h3>
                      <p>
                        {progress[0].complete
                          ? cause.rootCauseRationale
                          : "Does the trial support a fixture issue—and does the maintenance standard explain why it persisted?"}
                      </p>
                    </div>
                    <div className="workspace-hypothesis">
                      <b>Alternative explanation</b>
                      <p>Incoming material hardness changed.</p>
                      <span>
                        {doc.reviewedEvidenceIds.includes(ids.material)
                          ? "The supplied material record does not support a hardness change. It remains an unaccepted hypothesis."
                          : "Unaccepted hypothesis · inspect the material record."}
                      </span>
                    </div>
                    <button
                      className="product-button"
                      disabled={!readyForCause || progress[0].complete}
                      onClick={() =>
                        send(
                          { type: "accept_cause" },
                          "Cause accepted with its source evidence. The material hypothesis remains unaccepted.",
                        )
                      }
                    >
                      {progress[0].complete
                        ? "Cause accepted with evidence ✓"
                        : "Accept the supported cause"}
                    </button>
                    {!readyForCause ? (
                      <p className="workspace-hint">
                        Review all three source records to continue.
                      </p>
                    ) : null}
                    {progress[0].complete ? (
                      <button
                        className="workspace-text-button"
                        onClick={() => go("Actions")}
                      >
                        Continue to the countermeasure →
                      </button>
                    ) : null}
                  </section>
                </>
              ) : null}
              {view === "Actions" ? (
                <section className="workspace-card">
                  <div className="workspace-section-heading">
                    <span className="workspace-step">03</span>
                    <h2>Change the condition that caused it.</h2>
                  </div>
                  <div className="workspace-action-title">
                    <p className="product-eyebrow">
                      ACTION A-001 · REQUIRED FOR CLOSURE
                    </p>
                    <h3>{action.title}</h3>
                    <span
                      className={`workspace-badge ${action.status === "complete" ? "is-good" : ""}`}
                      data-testid="action-status"
                    >
                      {actionLabels[action.status]}
                    </span>
                  </div>
                  <div className="workspace-cause">
                    <p className="product-eyebrow">
                      {linked ? "LINKED ROOT CAUSE" : "CAUSE CONNECTION NEEDED"}
                    </p>
                    <p>{cause.text}</p>
                    <button
                      className="workspace-secondary"
                      disabled={!progress[0].complete || linked}
                      onClick={() =>
                        send(
                          { type: "connect_action" },
                          "Action A-001 now addresses the accepted cause. This link is shared across the workspace.",
                        )
                      }
                    >
                      {linked
                        ? "Connected to cause ✓"
                        : "Connect this countermeasure"}
                    </button>
                    {!progress[0].complete ? (
                      <button
                        className="workspace-text-button"
                        onClick={() => go("Problems")}
                      >
                        Review and accept the cause first →
                      </button>
                    ) : null}
                  </div>
                  <div className="workspace-assignment">
                    <label htmlFor="demo-owner">
                      Fictional action owner
                      <select
                        id="demo-owner"
                        value={action.owner ?? ""}
                        onChange={(e) =>
                          send(
                            { type: "assign_owner", owner: e.target.value },
                            "Action owner updated across the workspace.",
                          )
                        }
                      >
                        <option value="">Choose an owner</option>
                        {owners.map((owner) => (
                          <option key={owner}>{owner}</option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <span>Due in the scenario</span>
                      <strong>5 August 2026</strong>
                      <small>Historical fictional timeline</small>
                    </div>
                  </div>
                  <h3 className="workspace-subheading">
                    Inspect what was implemented.
                  </h3>
                  <EvidenceCard id={ids.implementation} />
                  <p className="workspace-muted">
                    The supplied record covers the locator replacement and
                    standard-work change. Confirming it completes the action;
                    follow-up verification remains separate.
                  </p>
                  <button
                    className="product-button"
                    disabled={
                      !linked ||
                      !action.owner ||
                      !doc.reviewedEvidenceIds.includes(ids.implementation) ||
                      action.status === "complete"
                    }
                    onClick={() =>
                      send(
                        { type: "complete_action" },
                        "Countermeasure complete. The problem stays open until the follow-up result is verified.",
                      )
                    }
                  >
                    {action.status === "complete"
                      ? "Countermeasure complete ✓"
                      : "Confirm demo action complete"}
                  </button>
                  {action.status !== "complete" ? (
                    <p className="workspace-hint">
                      Requires a connected cause, owner, and reviewed completion
                      record.
                    </p>
                  ) : (
                    <button
                      className="workspace-text-button"
                      onClick={() => go("Results")}
                    >
                      Continue to verification →
                    </button>
                  )}
                </section>
              ) : null}
              {view === "Results" ? (
                <>
                  <section className="workspace-card">
                    <div className="workspace-section-heading">
                      <span className="workspace-step">04</span>
                      <h2>Follow the evidence through time.</h2>
                    </div>
                    <p className="workspace-time-note">
                      <b>Demonstration time is compressed.</b> The supplied
                      records span 6–19 August 2026: ten working days. A real
                      investigation must wait for its actual observation period.
                    </p>
                    <ActionReference
                      actionTitle={action.title}
                      owner={action.owner}
                      state={actionLabels[action.status]}
                      onClick={() => go("Actions")}
                    />
                    <div
                      className="workspace-result-chart"
                      aria-label="Rejection rates from the linked inspection observations. Target at most 1 percent per follow-up lot."
                    >
                      {observations.rows.map((observation) => (
                        <div key={observation.id}>
                          <span>{observation.label}</span>
                          <div>
                            <i
                              style={{
                                width: `${(observation.rate / Math.max(1, ...observations.rows.map((o) => o.rate))) * 100}%`,
                              }}
                            />
                          </div>
                          <strong>{observation.rate}%</strong>
                          <small>
                            {observation.rejected} / {observation.inspected}
                          </small>
                        </div>
                      ))}
                      <p>
                        Rejection rate · target ≤1% in every follow-up lot.
                        Baseline and follow-up use different sample sizes.
                      </p>
                    </div>
                    <EvidenceCard id={ids.followup} />
                    <div className="workspace-observed">
                      <span>Observed in the supplied window</span>
                      <strong>
                        {observations.rejected} /{" "}
                        {observations.inspected.toLocaleString("en-US")}{" "}
                        <small>
                          parts rejected ·{" "}
                          {observations.rate?.toFixed(2) ?? "—"}% overall
                        </small>
                      </strong>
                      <p>
                        This is a fictional quality result, with no claim about
                        savings or future performance.
                      </p>
                    </div>
                  </section>
                  <section className="workspace-card">
                    <h2>Make the review explicit.</h2>
                    <label className="workspace-field" htmlFor="demo-result">
                      Your demo assessment
                      <select
                        id="demo-result"
                        value={outcome}
                        onChange={(e) =>
                          setOutcome(e.target.value as VerificationResult)
                        }
                      >
                        {(
                          Object.keys(resultLabels) as VerificationResult[]
                        ).map((result) => (
                          <option value={result} key={result}>
                            {resultLabels[result]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="workspace-muted">
                      Reviewer: Alex Morgan (fictional). Approval requires
                      completed required work, coverage of every accepted cause,
                      and linked evidence supporting an effective result.
                    </p>
                    {blockers.length > 0 ? (
                      <details className="workspace-blockers" open>
                        <summary>Verification is not ready</summary>
                        <ul>
                          {blockers.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    {verified ? (
                      <p className="workspace-success">
                        ✓ Demo verification approved. All required checks passed
                        for this observation window.
                      </p>
                    ) : (
                      <>
                        <button
                          className="product-button"
                          disabled={
                            outcome === "effective" && blockers.length > 0
                          }
                          onClick={() =>
                            send(
                              { type: "verify", result: outcome },
                              outcome === "effective"
                                ? "Demo verification approved. The first verified improvement milestone is now earned."
                                : `Review recorded as ${resultLabels[outcome].toLowerCase()}. The investigation remains open; no verified milestone earned.`,
                            )
                          }
                        >
                          {outcome === "effective"
                            ? "Approve demo verification"
                            : "Record review · keep open"}
                        </button>
                        {outcome !== "effective" ? (
                          <p className="workspace-hint">
                            Monitoring, partial, and ineffective results keep
                            the loop open.
                          </p>
                        ) : null}
                      </>
                    )}
                    {verified ? (
                      <button
                        className="workspace-text-button"
                        onClick={() => go("Lessons")}
                      >
                        Save the approved lesson →
                      </button>
                    ) : null}
                  </section>
                </>
              ) : null}
              {view === "Lessons" ? (
                <section className="workspace-card">
                  <div className="workspace-section-heading">
                    <span className="workspace-step">05</span>
                    <h2>Make this useful for the next shift.</h2>
                  </div>
                  <p
                    className={`workspace-badge ${progress[3].complete ? "is-good" : ""}`}
                  >
                    {progress[3].complete
                      ? "Approved lesson"
                      : lesson
                        ? "Retained · needs re-review"
                        : "Suggested lesson · not yet approved"}
                  </p>
                  <h3 className="workspace-lesson-title">
                    Fix the fixture. Change the standard. Check that it holds.
                  </h3>
                  <p className="workspace-lead">
                    {lesson?.lesson ??
                      "A fixture replacement corrects today’s defect. A defined wear limit and setup check address recurrence. Verify the change across shifts and production lots before standardizing it elsewhere."}
                  </p>
                  <div className="workspace-lesson-sources">
                    <p className="product-eyebrow">LEARNING WITH A SOURCE</p>
                    <button onClick={() => go("Problems")}>
                      LS-001 · Problem and supporting evidence →
                    </button>
                    <button onClick={() => go("Actions")}>
                      A-001 · {actionLabels[action.status]} · Countermeasure →
                    </button>
                    <button onClick={() => go("Results")}>
                      {lesson?.sourceVerificationId ?? "Pending verification"} ·{" "}
                      {verified ? "Effective result" : "Review required"} →
                    </button>
                  </div>
                  <p className="workspace-muted">
                    Scope: bracket drilling at Cell 3. Review other locating
                    fixtures before applying this lesson; their wear limits may
                    differ.
                  </p>
                  {progress[3].complete ? (
                    <p className="workspace-success">
                      ✓ Approved by {lesson?.approvedBy}. Learning retained with
                      the verification that supports it.
                    </p>
                  ) : (
                    <>
                      <button
                        className="product-button"
                        disabled={!verified}
                        onClick={() =>
                          send(
                            { type: "approve_lesson" },
                            "Approved lesson retained in this browser and included in your demo export.",
                          )
                        }
                      >
                        {lesson
                          ? "Reapprove lesson with new verification"
                          : "Approve and save lesson"}
                      </button>
                      {!verified ? (
                        <p className="workspace-hint">
                          Verify the improvement before approving this lesson.
                        </p>
                      ) : null}
                    </>
                  )}
                  <div className="workspace-reopen">
                    <h3>Learning stays open to new evidence.</h3>
                    <p>
                      Reopening preserves the investigation and any lesson.
                      Verification and learning milestones return to review
                      until new checks support the result.
                    </p>
                    <button
                      className="workspace-secondary"
                      disabled={inv.status === "reopened"}
                      onClick={() => {
                        send(
                          { type: "reopen" },
                          "Investigation reopened. Prior work is preserved; verification and lesson approval need review.",
                        );
                        setOutcome("monitoring");
                      }}
                    >
                      Reopen for a new concern
                    </button>
                  </div>
                  {progress[3].complete ? (
                    <div className="workspace-finish">
                      <p className="product-eyebrow">
                        YOU’VE CLOSED THE DEMO LOOP
                      </p>
                      <h3>Bring this workflow to your team.</h3>
                      <p>
                        Company workspaces and subscriptions are planned. Join
                        the pilot to discuss your use case.
                      </p>
                      <Link className="product-button" href="/pilot">
                        Join the pilot ↗
                      </Link>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
            <aside className="workspace-guide">
              <div className="workspace-next">
                <p className="product-eyebrow">
                  {progress[3].complete
                    ? "WORKFLOW COMPLETE"
                    : "YOUR NEXT USEFUL STEP"}
                </p>
                <h2>{next.label}</h2>
                <p>{next.text}</p>
                {next.view !== view ? (
                  <button
                    className="workspace-secondary"
                    onClick={() => go(next.view)}
                  >
                    Open {next.view.toLowerCase()} →
                  </button>
                ) : (
                  <p className="workspace-current">You’re in the right view.</p>
                )}
              </div>
              <div className="workspace-progress">
                <div>
                  <h2>Evidence, then progress.</h2>
                  <button
                    aria-expanded={doc.showProgress}
                    onClick={() => dispatch({ type: "toggle_progress" })}
                  >
                    {doc.showProgress ? "Hide" : "Show"}
                  </button>
                </div>
                {doc.showProgress ? (
                  <>
                    <ol>
                      {progress.map((item, i) => (
                        <li
                          key={item.label}
                          className={item.complete ? "is-complete" : ""}
                          data-testid={`milestone-${i}`}
                          data-complete={String(item.complete)}
                        >
                          <span aria-hidden="true">
                            {item.complete ? "✓" : "○"}
                          </span>
                          {item.label}
                        </li>
                      ))}
                    </ol>
                    <p>
                      No speed scores. No points for closing early. New evidence
                      is a reason to learn.
                    </p>
                    {progress[1].complete ? (
                      <p className="workspace-contribution">
                        <b>Contribution retained</b>
                        <br />
                        {action.owner?.split(" · ")[0]} owns the completed
                        countermeasure; the quality review stays attached to the
                        result.
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div className="workspace-same-record">
                <p className="product-eyebrow">
                  THE SAME RECORD, IN EVERY VIEW
                </p>
                <p>LS-001 · Bracket quality</p>
                <button onClick={() => go("Actions")}>
                  A-001{" "}
                  <b data-testid="shared-action-status">
                    {actionLabels[action.status]}
                  </b>
                  <span>{action.owner?.split(" · ")[0] ?? "Owner needed"}</span>
                </button>
              </div>
            </aside>
          </div>
          <p className="workspace-bottom-note">
            This is a fictional, individual browser preview. No shared accounts,
            cloud backup, or subscriptions are active.{" "}
            <Link href="/pilot">What’s next →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
function EvidenceCard({ id }: { id: string }) {
  const { doc, dispatch } = ctx.useDocument();
  const evidence = doc.investigation.evidence.find((e) => e.id === id);
  if (!evidence)
    return (
      <p role="alert">
        Source record missing. Verification requires its evidence.
      </p>
    );
  const reviewed = doc.reviewedEvidenceIds.includes(id);
  return (
    <details className="workspace-evidence">
      <summary>
        <span className="evidence-icon" aria-hidden="true">
          ▤
        </span>
        <span>
          <strong>{evidence.title}</strong>
          <small>{evidence.date} · Fictional source record</small>
        </span>
        <span className="evidence-review-state">
          {reviewed ? "Reviewed ✓" : "Inspect +"}
        </span>
      </summary>
      <div>
        <blockquote>{evidence.description}</blockquote>
        <p className="workspace-citation">Source: {evidence.source}</p>
        <label>
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) =>
              dispatch({
                type: "review_evidence",
                id,
                reviewed: e.target.checked,
              })
            }
          />
          {id === ids.followup
            ? "I reviewed this observation window; include this evidence"
            : "I reviewed this source record"}
        </label>
      </div>
    </details>
  );
}
function ActionReference({
  actionTitle,
  owner,
  state,
  onClick,
}: {
  actionTitle: string;
  owner?: string;
  state: string;
  onClick: () => void;
}) {
  return (
    <button className="workspace-action-reference" onClick={onClick}>
      <span>A-001 · {actionTitle}</span>
      <b>{state} →</b>
      <small>{owner ?? "Owner needed"}</small>
    </button>
  );
}
