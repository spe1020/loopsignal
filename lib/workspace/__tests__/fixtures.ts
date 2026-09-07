import { createDemo, ids, owners, reduceDemo, type Demo } from "../demo";

export function completedAction(): Demo {
  let d = createDemo();
  for (const id of [
    ids.baseline,
    ids.fixture,
    ids.material,
    ids.implementation,
    ids.followup,
  ])
    d = reduceDemo(d, { type: "review_evidence", id, reviewed: true });
  d = reduceDemo(d, { type: "accept_cause" });
  d = reduceDemo(d, { type: "connect_action" });
  d = reduceDemo(d, { type: "assign_owner", owner: owners[0] });
  return reduceDemo(d, { type: "complete_action" });
}
