import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClosureBlockers } from "@/components/solve/stages/ClosureBlockers";
import { completedAction } from "@/lib/workspace/__tests__/fixtures";
import { verificationCandidate } from "@/lib/workspace/demo";
import { hardFindings, type Finding } from "../rules";
import { reduce } from "../reducer";

describe("closure blocker rendering", () => {
  it("renders every domain blocker for incomplete work and missing reviewer", () => {
    let inv = verificationCandidate(completedAction(), "effective");
    inv = reduce(inv, {
      type: "update_action",
      id: inv.actions[0].id,
      patch: { status: "in_progress" },
    });
    inv = reduce(inv, {
      type: "update_verification",
      id: inv.verifications[0].id,
      patch: { verifier: "" },
    });
    const findings = hardFindings(inv);
    const markup = renderToStaticMarkup(
      createElement(ClosureBlockers, { findings, onFix: () => {} }),
    );
    expect(findings.map((f) => f.code)).toEqual(
      expect.arrayContaining([
        "root_unaddressed",
        "action_incomplete",
        "verification_without_evidence",
        "action_unverified",
      ]),
    );
    for (const f of findings) {
      expect(markup).toContain(`data-finding-code="${f.code}"`);
      expect(markup).toContain(f.message.replaceAll('"', "&quot;"));
    }
    expect(markup.match(/<button/g)).toHaveLength(findings.length);
  });
  it("renders a future unknown finding without a code allowlist", () => {
    const findings: Finding[] = [
      {
        code: "future_rule",
        level: "hard",
        stage: "investigate",
        entityId: "future-record",
        message: "New requirement with a useful source reference",
      },
    ];
    const markup = renderToStaticMarkup(
      createElement(ClosureBlockers, { findings, onFix: () => {} }),
    );
    expect(markup).toContain(findings[0].message);
    expect(markup).toContain("Open investigate stage");
  });
});
