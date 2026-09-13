"use client";
import { useEffect, useRef, useState } from "react";
import { currentReview } from "@/lib/solve/reviews";
import { hostedBlockers } from "@/lib/hosted/domain-view";
import type {
  BusinessCommand,
  Member,
  RecordEnvelope,
} from "@/lib/hosted/types";
import { Fields, val, selected, type Field } from "./forms";
export type Api = (path: string, data?: unknown) => Promise<unknown>;
type Editor = {
  key: string;
  title: string;
  fields: Field[];
  command: (f: FormData) => BusinessCommand;
};
function recovery(value: unknown, name = "loopsignal-recovery.json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export { recovery };
export function RecordEditor({
  initial,
  initialSection = "problem",
  members,
  me,
  readOnly,
  api,
  onBack,
  onRecord,
  onDuplicate,
}: {
  initial: RecordEnvelope;
  initialSection?: string;
  members: Member[];
  me: Member;
  readOnly: boolean;
  api: Api;
  onBack: () => void;
  onRecord: (r: RecordEnvelope) => void;
  onDuplicate: (r: RecordEnvelope) => void;
}) {
  const [row, setRow] = useState(initial),
    [section, setSection] = useState(initialSection),
    [sourceReview, setSourceReview] = useState<string | null>(null),
    [edit, setEdit] = useState<Editor | null>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false),
    [saved, setSaved] = useState("Saved to company"),
    [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const form = useRef<HTMLFormElement>(null),
    pending = useRef<{ serialized: string; id: string } | null>(null),
    busyRef = useRef(false),
    dirtyRef = useRef(false),
    rowRef = useRef(row);
  const inv = row.document.investigation;
  const files = useRef(
    new Map<
      string,
      {
        file: File;
        stageId: string;
        finalId: string;
        attachmentId?: string;
        revision?: number;
      }
    >(),
  );
  const options = (items: { id: string; title?: string; text?: string }[]) =>
    items.map((i) => ({ value: i.id, label: i.title ?? i.text ?? i.id }));
  const memberOptions = [
    { value: "", label: "Unassigned" },
    ...members
      .filter(
        (m) =>
          !m.revoked_at &&
          ["owner", "manager", "collaborator", "participant"].includes(m.role),
      )
      .map((m) => ({ value: m.user_id, label: m.display_name })),
  ];
  const canEdit =
      !readOnly && ["owner", "manager", "collaborator"].includes(me.role),
    canEvidence = canEdit || (!readOnly && me.role === "participant");
  const name = (id?: string) =>
    members.find((m) => m.user_id === id)?.display_name ?? id ?? "Unassigned";
  function update(r: RecordEnvelope) {
    setRow(r);
    rowRef.current = r;
    onRecord(r);
  }
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || busyRef.current || files.current.size) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, []);
  async function send(
    command: BusinessCommand,
  ): Promise<RecordEnvelope | null> {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setConflict(false);
    setSaved("Saving…");
    const current = rowRef.current;
    const serialized = JSON.stringify({ command, revision: current.revision });
    if (pending.current?.serialized !== serialized)
      pending.current = { serialized, id: crypto.randomUUID() };
    try {
      const next = (await api("commands", {
        version: 1,
        organizationId: current.org_id,
        recordId: current.id,
        expectedRevision: current.revision,
        commandId: pending.current.id,
        correlationId: pending.current.id,
        command,
      })) as RecordEnvelope;
      update(next);
      pending.current = null;
      setSaved("Saved to company");
      if (command.type === "delete_record") onBack();
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setConflict(e instanceof Error && e.message.includes("revision"));
      setSaved("Unsaved · retry or export recovery");
      return null;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function flush(allowPendingFiles = false) {
    if (!allowPendingFiles && files.current.size) {
      setError(
        "Finish the selected upload before leaving or duplicating. Retry it in Evidence, or export recovery with the selected bytes.",
      );
      return false;
    }
    if (!dirtyRef.current) return !busyRef.current;
    if (!edit || !form.current || !form.current.reportValidity()) return false;
    const command = edit.command(new FormData(form.current));
    const r = await send(command);
    if (!r) return false;
    dirtyRef.current = false;
    setDirty(false);
    return true;
  }
  async function navigate(next: () => void) {
    if (await flush()) next();
  }
  async function command(c: BusinessCommand) {
    if (!(await flush())) return;
    await send(c);
  }
  function open(editor: Editor) {
    void navigate(() => {
      setEdit(editor);
      setError("");
    });
  }
  function problem() {
    open({
      key: "problem",
      title: "Describe the problem",
      fields: [
        {
          name: "title",
          label: "Short title",
          value: inv.title,
          required: true,
        },
        {
          name: "whatHappened",
          label: "What happened?",
          type: "textarea",
          value: inv.problem.whatHappened,
          required: true,
        },
        { name: "where", label: "Where?", value: inv.problem.where },
        {
          name: "whatShouldHaveHappened",
          label: "What should have happened?",
          value: inv.problem.whatShouldHaveHappened,
        },
        { name: "impact", label: "Observed impact", value: inv.problem.impact },
      ],
      command: (f) => ({
        type: "edit_problem",
        data: {
          title: val(f, "title"),
          whatHappened: val(f, "whatHappened"),
          where: val(f, "where"),
          whatShouldHaveHappened: val(f, "whatShouldHaveHappened"),
          impact: val(f, "impact"),
        },
      }),
    });
  }
  function evidence(id?: string) {
    const e = inv.evidence.find((e) => e.id === id);
    open({
      key: `evidence-${id ?? "new"}`,
      title: e ? "Edit source evidence" : "Add evidence",
      fields: [
        {
          name: "title",
          label: "Evidence title",
          value: e?.title,
          required: true,
        },
        {
          name: "description",
          label: "What does it show?",
          type: "textarea",
          value: e?.description,
          required: true,
        },
        {
          name: "source",
          label: "Source / reference",
          value: e?.source,
          required: true,
          hint: "A record, observation, or location that another person can check.",
        },
        {
          name: "date",
          label: "Observed on",
          type: "date",
          value: e?.date ?? new Date().toISOString().slice(0, 10),
          required: true,
        },
        {
          name: "type",
          label: "Evidence type",
          type: "select",
          value: e?.type ?? "observation",
          options: [
            "observation",
            "measurement",
            "document",
            "photo_ref",
            "test_result",
            "interview",
            "system_record",
            "historical_incident",
          ].map((value) => ({ value, label: value.replaceAll("_", " ") })),
        },
      ],
      command: (f) => {
        const data = {
          title: val(f, "title"),
          description: val(f, "description"),
          source: val(f, "source"),
          date: val(f, "date"),
          type: val(f, "type") as "observation",
        };
        return id
          ? { type: "edit_evidence", id, data }
          : { type: "add_evidence", data };
      },
    });
  }
  function cause(id?: string) {
    const c = inv.causes.find((c) => c.id === id);
    open({
      key: `cause-${id ?? "new"}`,
      title: c ? "Edit cause" : "Investigate a cause",
      fields: [
        {
          name: "text",
          label: "Cause / hypothesis",
          value: c?.text,
          required: true,
        },
        {
          name: "classification",
          label: "Classification",
          type: "select",
          value: c?.classification ?? "unclassified",
          options: ["unclassified", "symptom", "contributing", "root"].map(
            (value) => ({ value, label: value }),
          ),
        },
        {
          name: "evidenceState",
          label: "Evidence state",
          type: "select",
          value: c?.evidenceState ?? "assumption",
          options: [
            "assumption",
            "observed",
            "data_supported",
            "verified",
            "disproved",
          ].map((value) => ({ value, label: value.replaceAll("_", " ") })),
        },
        {
          name: "rootCauseRationale",
          label: "Why does this explain the problem?",
          type: "textarea",
          value: c?.rootCauseRationale,
        },
        {
          name: "parentId",
          label: "Parent cause",
          type: "select",
          value: c?.parentId ?? "",
          options: [
            { value: "", label: "No parent" },
            ...options(inv.causes.filter((c) => c.id !== id)),
          ],
        },
        {
          name: "challenged",
          label: "This cause is still challenged",
          type: "checkbox",
          value: c?.challenged,
        },
      ],
      command: (f) => {
        const data = {
          text: val(f, "text"),
          classification: val(f, "classification") as "root",
          evidenceState: val(f, "evidenceState") as "assumption",
          rootCauseRationale: val(f, "rootCauseRationale"),
          parentId: val(f, "parentId") || null,
          challenged: f.has("challenged"),
        };
        return id
          ? { type: "edit_cause", id, data }
          : { type: "add_cause", data };
      },
    });
  }
  function action(id?: string) {
    const a = inv.actions.find((a) => a.id === id);
    open({
      key: `action-${id ?? "new"}`,
      title: a ? "Edit action" : "Plan an action",
      fields: [
        {
          name: "title",
          label: "Action title",
          value: a?.title,
          required: true,
        },
        {
          name: "description",
          label: "What will change?",
          type: "textarea",
          value: a?.description,
        },
        {
          name: "owner",
          label: "Assigned to",
          type: "select",
          value: a?.owner ?? "",
          options: memberOptions,
        },
        {
          name: "linkedCauseIds",
          label: "Causes addressed",
          type: "checks",
          value: a?.linkedCauseIds,
          options: options(inv.causes),
        },
        {
          name: "kind",
          label: "Action kind",
          type: "select",
          value: a?.kind ?? "corrective",
          options: [
            { value: "corrective", label: "Corrective" },
            { value: "preventive", label: "Preventive" },
          ],
        },
        {
          name: "requiredForClosure",
          label:
            "Required for closure (corrective actions are always required)",
          type: "checkbox",
          value: a?.requiredForClosure,
        },
        { name: "dueDate", label: "Due date", type: "date", value: a?.dueDate },
        {
          name: "verificationMethod",
          label: "How will the result be checked?",
          value: a?.verificationMethod,
        },
        {
          name: "expectedResult",
          label: "Expected result",
          value: a?.expectedResult,
        },
      ],
      command: (f) => {
        const data = {
          title: val(f, "title"),
          description: val(f, "description"),
          owner: val(f, "owner") || null,
          linkedCauseIds: selected(f, "linkedCauseIds"),
          kind: val(f, "kind") as "corrective",
          requiredForClosure: f.has("requiredForClosure"),
          dueDate: val(f, "dueDate"),
          verificationMethod: val(f, "verificationMethod"),
          expectedResult: val(f, "expectedResult"),
        };
        return id
          ? { type: "edit_action", id, data }
          : { type: "add_action", data };
      },
    });
  }
  function verification(id?: string) {
    const v = inv.verifications.find((v) => v.id === id);
    open({
      key: `verification-${id ?? "new"}`,
      title: v ? "Edit result" : "Record a result",
      fields: [
        {
          name: "actionId",
          label: "Action checked",
          type: "select",
          value: v?.actionId,
          options: options(inv.actions),
          required: true,
        },
        {
          name: "expected",
          label: "Expected result / acceptance criteria",
          value: v?.expected,
          required: true,
        },
        {
          name: "observed",
          label: "Observed result",
          type: "textarea",
          value: v?.observed,
          required: true,
        },
        {
          name: "checkAt",
          label: "Date checked",
          type: "date",
          value: v?.checkAt,
          required: true,
        },
        {
          name: "result",
          label: "Effectiveness",
          type: "select",
          value: v?.result ?? "monitoring",
          options: [
            "monitoring",
            "partially_effective",
            "not_effective",
            "effective",
          ].map((value) => ({ value, label: value.replaceAll("_", " ") })),
        },
        {
          name: "evidenceIds",
          label: "Supporting source evidence",
          type: "checks",
          options: options(inv.evidence),
          value: v?.evidenceIds,
        },
      ],
      command: (f) => {
        const data = {
          actionId: val(f, "actionId"),
          expected: val(f, "expected"),
          observed: val(f, "observed"),
          checkAt: val(f, "checkAt"),
          result: val(f, "result") as "effective",
          evidenceIds: selected(f, "evidenceIds"),
        };
        return id
          ? { type: "edit_verification", id, data }
          : { type: "add_verification", data };
      },
    });
  }
  function observation(verificationId: string, id?: string) {
    const o = row.document.observations.find((o) => o.id === id);
    open({
      key: `observation-${id ?? verificationId}`,
      title: "Source-linked measurement",
      fields: [
        {
          name: "evidenceId",
          label: "Source evidence",
          type: "select",
          value: o?.evidenceId,
          options: options(inv.evidence),
          required: true,
        },
        {
          name: "value",
          label: "Measured value",
          type: "number",
          value: o?.value,
          required: true,
        },
        {
          name: "unit",
          label: "Units",
          value: o?.unit,
          required: true,
          hint: "For example: mm, rejected parts, or percent.",
        },
        {
          name: "start",
          label: "Observation period starts",
          type: "date",
          value: o?.start,
          required: true,
        },
        {
          name: "end",
          label: "Observation period ends",
          type: "date",
          value: o?.end,
          required: true,
        },
      ],
      command: (f) => {
        const data = {
          verificationId,
          evidenceId: val(f, "evidenceId"),
          value: Number(val(f, "value")),
          unit: val(f, "unit"),
          start: val(f, "start"),
          end: val(f, "end"),
        };
        return id
          ? { type: "edit_observation", id, data }
          : { type: "add_observation", data };
      },
    });
  }
  function containment(id?: string) {
    const c = inv.containment.find((c) => c.id === id);
    open({
      key: `containment-${id ?? "new"}`,
      title: "Protect the process now",
      fields: [
        {
          name: "action",
          label: "Containment action",
          value: c?.action,
          required: true,
        },
        {
          name: "owner",
          label: "Owner",
          type: "select",
          value: c?.owner,
          options: memberOptions,
          required: true,
        },
        { name: "scope", label: "Scope / affected work", value: c?.scope },
        {
          name: "status",
          label: "Containment status",
          type: "select",
          value: c?.status ?? "open",
          options: ["open", "in_progress", "verified", "released"].map(
            (value) => ({ value, label: value.replaceAll("_", " ") }),
          ),
        },
        {
          name: "verificationNote",
          label: "Resolution evidence / rationale",
          type: "textarea",
          value: c?.verificationNote,
        },
      ],
      command: (f) => ({
        type: "set_containment",
        ...(id ? { id } : {}),
        data: {
          action: val(f, "action"),
          owner: val(f, "owner"),
          scope: val(f, "scope"),
          status: val(f, "status") as "open",
          verificationNote: val(f, "verificationNote"),
        },
      }),
    });
  }
  function lesson(id?: string) {
    const l = inv.lessons.find((l) => l.id === id);
    open({
      key: `lesson-${id ?? "new"}`,
      title: "Retain what the team learned",
      fields: [
        {
          name: "lesson",
          label: "Learning and standard work change",
          type: "textarea",
          value: l?.lesson,
          required: true,
        },
        {
          name: "relatedProcess",
          label: "Where else does this apply?",
          value: l?.relatedProcess,
        },
      ],
      command: (f) =>
        id
          ? {
              type: "edit_lesson",
              id,
              lesson: val(f, "lesson"),
              relatedProcess: val(f, "relatedProcess"),
            }
          : {
              type: "add_lesson",
              lesson: val(f, "lesson"),
              relatedProcess: val(f, "relatedProcess"),
            },
    });
  }
  async function upload(evidenceId: string, file?: File) {
    if (!(await flush(true))) return;
    if (file)
      files.current.set(evidenceId, {
        file,
        stageId: crypto.randomUUID(),
        finalId: crypto.randomUUID(),
      });
    const pendingFile = files.current.get(evidenceId);
    if (!pendingFile) return;
    setBusy(true);
    busyRef.current = true;
    setError("");
    try {
      if (!pendingFile.attachmentId) {
        const result = (await api("upload/stage", {
          organizationId: row.org_id,
          recordId: row.id,
          evidenceId,
          expectedRevision: rowRef.current.revision,
          commandId: pendingFile.stageId,
          filename: pendingFile.file.name,
          size: pendingFile.file.size,
          mediaType: pendingFile.file.type || "text/plain",
        })) as { attachment: { id: string }; record: RecordEnvelope };
        pendingFile.attachmentId = result.attachment.id;
        pendingFile.revision = result.record.revision;
        update(result.record);
      }
      const query = new URLSearchParams({
        organizationId: row.org_id,
        recordId: row.id,
        attachmentId: pendingFile.attachmentId,
        expectedRevision: String(rowRef.current.revision),
        commandId: pendingFile.finalId,
      });
      const response = await fetch(`/api/company/upload/finalize?${query}`, {
        method: "POST",
        body: pendingFile.file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      update(result);
      files.current.delete(evidenceId);
      setSaved("File verified and saved to company");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setConflict(e instanceof Error && e.message.includes("revision"));
      setSaved("Upload unfinished · selected bytes retained for retry");
    } finally {
      setBusy(false);
      busyRef.current = false;
      setPendingFiles([...files.current.keys()]);
    }
  }
  async function reload() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const next = (await api(
        `record?organizationId=${row.org_id}&recordId=${row.id}`,
      )) as RecordEnvelope;
      update(next);
      setConflict(false);
      setError("");
      setSaved(
        dirty
          ? "Latest company revision loaded · your draft is still unsaved"
          : "Saved to company",
      );
      pending.current = null;
    } catch (e) {
      setError(String(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const a = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !a ||
        a.href.includes("/api/company/file?") ||
        (!dirtyRef.current && !busyRef.current && !files.current.size)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void flush().then((ok) => {
        if (ok) window.location.assign(a.href);
      });
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  });
  const blockers = hostedBlockers(row.document, row.attachments);
  return (
    <section className="co-record" aria-busy={busy}>
      <div className="co-toolbar">
        <button onClick={() => void navigate(onBack)}>← Problems</button>
        <span role="status">
          {dirty ? "Unsaved draft" : saved} · revision {row.revision}
        </span>
        <button
          onClick={async () =>
            recovery({
              format: "loopsignal-editor-recovery",
              saved: row,
              editor: edit ? { key: edit.key, title: edit.title } : null,
              draft: form.current
                ? Array.from(new FormData(form.current).entries())
                : null,
              pendingFiles: await Promise.all(
                Array.from(files.current, async ([evidenceId, pendingFile]) => {
                  const bytes = new Uint8Array(
                    await pendingFile.file.arrayBuffer(),
                  );
                  let binary = "";
                  for (let i = 0; i < bytes.length; i += 8192)
                    binary += String.fromCharCode(
                      ...bytes.subarray(i, i + 8192),
                    );
                  return {
                    evidenceId,
                    filename: pendingFile.file.name,
                    mediaType: pendingFile.file.type,
                    attachmentId: pendingFile.attachmentId,
                    base64: btoa(binary),
                  };
                }),
              ),
            })
          }
        >
          Export recovery
        </button>
        <button
          onClick={() =>
            void navigate(async () => {
              try {
                recovery(
                  await api(
                    `export?organizationId=${row.org_id}&recordId=${row.id}`,
                  ),
                  "loopsignal-company-export.json",
                );
              } catch (e) {
                setError(String(e));
              }
            })
          }
        >
          Export records + files
        </button>
      </div>
      <div className="co-title">
        <p className="co-eyebrow">
          {inv.rcaNumber} · {inv.status.replaceAll("_", " ")}
        </p>
        <h1>{inv.title}</h1>
        <p>
          {inv.problem.where || "Add the process location when you know it."}
        </p>
      </div>
      <nav className="co-tabs" aria-label="Investigation sections">
        {[
          "problem",
          "containment",
          "evidence",
          "causes",
          "actions",
          "results",
          "lessons",
          "history",
        ].map((s) => (
          <button
            key={s}
            aria-current={section === s ? "page" : undefined}
            onClick={() =>
              void navigate(() => {
                setSection(s);
                setEdit(null);
              })
            }
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </nav>
      {error && (
        <div role="alert" className="co-error">
          {error}
          {conflict && (
            <button disabled={busy} onClick={reload}>
              Load latest; keep my draft
            </button>
          )}
        </div>
      )}
      {dirty && (
        <p className="co-notice">
          Save this draft before moving on. A failed save keeps you here.
          Recovery export preserves the entered fields.
        </p>
      )}
      {edit && (
        <form
          className="co-card co-editor"
          ref={form}
          key={edit.key}
          onChange={() => {
            dirtyRef.current = true;
            setDirty(true);
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            await flush();
          }}
        >
          <h2>{edit.title}</h2>
          <fieldset disabled={busy}>
            <Fields fields={edit.fields} />
            <button
              className="co-primary"
              type="submit"
              onClick={() => {
                dirtyRef.current = true;
                setDirty(true);
              }}
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => void navigate(() => setEdit(null))}
            >
              Done
            </button>
          </fieldset>
        </form>
      )}
      <div className="co-record-grid">
        <div>
          {section === "problem" && (
            <article className="co-card">
              <h2>What happened</h2>
              <p>{inv.problem.whatHappened}</p>
              <h3>Required outcome</h3>
              <p>{inv.problem.whatShouldHaveHappened || "Not recorded yet"}</p>
              <h3>Observed impact</h3>
              <p>{inv.problem.impact || "Not recorded yet"}</p>
              {canEdit && <button onClick={problem}>Edit problem</button>}
              <p className="co-muted">
                No ERP connection is required. Gather detail as the
                investigation develops.
              </p>
            </article>
          )}
          {section === "containment" && (
            <>
              <div className="co-toolbar">
                <h2>Containment</h2>
                {canEdit && (
                  <button onClick={() => containment()}>Add containment</button>
                )}
              </div>
              {!inv.containment.length && (
                <p className="co-empty">
                  No containment recorded. Add temporary protection if the
                  process needs it.
                </p>
              )}
              {inv.containment.map((c) => (
                <article className="co-card" id={`entity-${c.id}`} key={c.id}>
                  <h3>{c.action}</h3>
                  <p>
                    {name(c.owner)} · {c.status}
                  </p>
                  <p>{c.scope}</p>
                  <p>{c.verificationNote}</p>
                  {canEdit && (
                    <button onClick={() => containment(c.id)}>
                      Edit containment
                    </button>
                  )}
                </article>
              ))}
            </>
          )}
          {section === "evidence" && (
            <>
              <div className="co-toolbar">
                <h2>Source evidence</h2>
                {canEdit && (
                  <button onClick={() => command({ type: "verify_sources" })}>
                    Check stored source files
                  </button>
                )}
                {canEvidence && (
                  <button onClick={() => evidence()}>Add evidence</button>
                )}
              </div>
              {!inv.evidence.length && (
                <p className="co-empty">
                  Start with what the team observed. Add a source someone else
                  can inspect.
                </p>
              )}
              {inv.evidence.map((e) => (
                <article className="co-card" id={`entity-${e.id}`} key={e.id}>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                  <p className="co-muted">
                    {e.source} · {e.date}
                  </p>
                  {canEdit && (
                    <button onClick={() => evidence(e.id)}>
                      Edit evidence
                    </button>
                  )}
                  {row.document.provenance?.missingFiles.includes(e.id) && (
                    <p role="alert">
                      Imported file unresolved. Upload the original source
                      bytes.
                    </p>
                  )}
                  {row.attachments
                    .filter((f) => f.evidence_id === e.id)
                    .map((f) => (
                      <div className="co-file" key={f.id}>
                        <span>
                          {f.filename} · {f.state}
                        </span>
                        {f.state === "ready" && (
                          <a
                            href={`/api/company/file?organizationId=${row.org_id}&recordId=${row.id}&attachmentId=${f.id}`}
                          >
                            Download source
                          </a>
                        )}
                        {!readOnly &&
                          ["owner", "manager"].includes(me.role) &&
                          f.state !== "deleted" && (
                            <button
                              onClick={() =>
                                command({ type: "remove_attachment", id: f.id })
                              }
                            >
                              Remove file and withdraw affected approval
                            </button>
                          )}
                      </div>
                    ))}
                  {canEvidence && (
                    <label className="co-field">
                      Attach private evidence (PDF, PNG, JPEG, text, CSV; 10
                      MiB)
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                        disabled={busy}
                        onChange={(event) =>
                          void upload(e.id, event.currentTarget.files?.[0])
                        }
                      />
                    </label>
                  )}
                  {pendingFiles.includes(e.id) && (
                    <button onClick={() => upload(e.id)}>
                      Retry selected upload
                    </button>
                  )}
                </article>
              ))}
            </>
          )}
          {section === "causes" && (
            <>
              <div className="co-toolbar">
                <h2>Causes and support</h2>
                {canEdit && <button onClick={() => cause()}>Add cause</button>}
              </div>
              {!inv.causes.length && (
                <p className="co-empty">
                  Describe a process condition, then test it against source
                  evidence.
                </p>
              )}
              {inv.causes.map((c) => (
                <article className="co-card" id={`entity-${c.id}`} key={c.id}>
                  <h3>{c.text}</h3>
                  <p>
                    {c.classification} · {c.evidenceState.replaceAll("_", " ")}
                  </p>
                  <p>{c.rootCauseRationale}</p>
                  {inv.evidenceLinks
                    .filter((l) => l.causeId === c.id)
                    .map((l) => (
                      <p key={l.id}>
                        {l.relation}:{" "}
                        <button
                          onClick={() =>
                            navigate(() => {
                              setSection("evidence");
                              setEdit(null);
                            })
                          }
                        >
                          {
                            inv.evidence.find((e) => e.id === l.evidenceId)
                              ?.title
                          }
                        </button>
                      </p>
                    ))}
                  {canEdit && (
                    <>
                      <button onClick={() => cause(c.id)}>Edit cause</button>
                      <button
                        onClick={() =>
                          open({
                            key: `link-${c.id}`,
                            title: "Link source evidence",
                            fields: [
                              {
                                name: "evidenceId",
                                label: "Evidence",
                                type: "select",
                                options: options(inv.evidence),
                                required: true,
                              },
                              {
                                name: "relation",
                                label: "Relationship",
                                type: "select",
                                options: [
                                  { value: "supports", label: "Supports" },
                                  {
                                    value: "contradicts",
                                    label: "Contradicts",
                                  },
                                ],
                              },
                            ],
                            command: (f) => ({
                              type: "link_evidence",
                              causeId: c.id,
                              evidenceId: val(f, "evidenceId"),
                              relation: val(f, "relation") as "supports",
                            }),
                          })
                        }
                      >
                        Link evidence
                      </button>
                    </>
                  )}
                </article>
              ))}
            </>
          )}
          {section === "actions" && (
            <>
              <div className="co-toolbar">
                <h2>Coordinated actions</h2>
                {canEdit && (
                  <button onClick={() => action()}>Add action</button>
                )}
              </div>
              {!inv.actions.length && (
                <p className="co-empty">
                  Assign a countermeasure to a current team member.
                </p>
              )}
              {inv.actions.map((a) => (
                <article className="co-card" id={`entity-${a.id}`} key={a.id}>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <p>
                    {name(a.owner)} · {a.dueDate || "No due date"} ·{" "}
                    {a.status.replaceAll("_", " ")}
                  </p>
                  <p>{a.expectedResult}</p>
                  {canEdit && (
                    <button onClick={() => action(a.id)}>Edit action</button>
                  )}
                  {(canEdit ||
                    (!readOnly &&
                      me.role === "participant" &&
                      a.owner === me.user_id)) && (
                    <label className="co-field">
                      Update action status
                      <select
                        value={a.status}
                        onChange={(e) =>
                          void command({
                            type: "action_status",
                            id: a.id,
                            status: e.target.value as "complete",
                          })
                        }
                      >
                        {[
                          "open",
                          "in_progress",
                          "ready_for_verification",
                          "complete",
                        ].map((s) => (
                          <option value={s} key={s}>
                            {s.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </article>
              ))}
            </>
          )}
          {section === "results" && (
            <>
              <div className="co-toolbar">
                <h2>Results with evidence</h2>
                {canEdit && (
                  <button onClick={() => verification()}>Record result</button>
                )}
              </div>
              <p className="co-muted">
                An Effective label is a proposed result. An authorized reviewer
                must explicitly approve the current evidence.
              </p>
              {inv.verifications.map((v) => {
                const review = currentReview(inv, v);
                return (
                  <article className="co-card" key={v.id} id={`entity-${v.id}`}>
                    <h3>
                      {inv.actions.find((a) => a.id === v.actionId)?.title}
                    </h3>
                    <p>Expected: {v.expected}</p>
                    <p>Observed: {v.observed}</p>
                    <p>
                      {v.result.replaceAll("_", " ")} · checked {v.checkAt}
                    </p>
                    <p>
                      {review
                        ? `Current approval by ${name(review.approvedBy)} on ${review.approvedAt}`
                        : "Approval required"}
                    </p>
                    {v.evidenceIds.map((id) => (
                      <p key={id}>
                        <button
                          onClick={() =>
                            navigate(() => {
                              setSection("evidence");
                              setEdit(null);
                            })
                          }
                        >
                          {inv.evidence.find((e) => e.id === id)?.title}
                        </button>
                      </p>
                    ))}
                    {row.document.observations
                      .filter((o) => o.verificationId === v.id)
                      .map((o) => (
                        <p key={o.id}>
                          {o.value} {o.unit} · {o.start} – {o.end} ·{" "}
                          {
                            inv.evidence.find((e) => e.id === o.evidenceId)
                              ?.title
                          }{" "}
                          {canEdit && (
                            <button onClick={() => observation(v.id, o.id)}>
                              Edit measurement
                            </button>
                          )}
                        </p>
                      ))}
                    {canEdit && (
                      <>
                        <button onClick={() => verification(v.id)}>
                          Edit result
                        </button>
                        <button onClick={() => observation(v.id)}>
                          Add measurement
                        </button>
                      </>
                    )}
                    {me.reviewer && !readOnly && !review && (
                      <button
                        className="co-primary"
                        onClick={() =>
                          open({
                            key: `approve-${v.id}`,
                            title: "Approve the current result",
                            fields: [
                              {
                                name: "acknowledge",
                                label:
                                  inv.actions.find((a) => a.id === v.actionId)
                                    ?.owner === me.user_id
                                    ? "I understand this is approval of my own action."
                                    : "I inspected the current evidence, measurement period, and completed work.",
                                type: "checkbox",
                              },
                            ],
                            command: (f) => ({
                              type: "approve_verification",
                              id: v.id,
                              selfReviewAcknowledged: f.has("acknowledge"),
                            }),
                          })
                        }
                      >
                        Review and approve
                      </button>
                    )}
                  </article>
                );
              })}
            </>
          )}
          {section === "lessons" && (
            <>
              <div className="co-toolbar">
                <h2>Retained learning</h2>
                {canEdit && (
                  <button onClick={() => lesson()}>Add lesson</button>
                )}
              </div>
              {!inv.lessons.length && (
                <p className="co-empty">
                  Capture what changed and where else it could help. Approval
                  requires a closed improvement and its exact supporting review.
                </p>
              )}
              {inv.lessons.map((l) => {
                const v = inv.verifications.find(
                  (v) => v.id === l.sourceVerificationId,
                );
                const approved =
                  inv.status === "closed" &&
                  v &&
                  currentReview(inv, v)?.id === l.sourceReviewId &&
                  l.approvedAt;
                return (
                  <article className="co-card" key={l.id}>
                    <h3>{l.lesson}</h3>
                    <p>{l.relatedProcess}</p>
                    <p>
                      {approved
                        ? "Approved learning"
                        : "Retained learning · current approval required"}
                    </p>
                    {l.sourceReviewId && (
                      <p className="co-muted">
                        <button
                          onClick={() =>
                            navigate(() => {
                              setSourceReview(l.sourceReviewId!);
                              setSection("history");
                              setEdit(null);
                            })
                          }
                        >
                          Inspect the supporting review
                        </button>
                      </p>
                    )}
                    {canEdit && (
                      <button onClick={() => lesson(l.id)}>Edit lesson</button>
                    )}
                    {me.reviewer && !readOnly && (
                      <button
                        onClick={() =>
                          open({
                            key: `lesson-review-${l.id}`,
                            title:
                              "Approve this lesson against its supporting decision",
                            fields: [
                              {
                                name: "reviewId",
                                label: "Supporting result review",
                                type: "select",
                                options: inv.verifications.flatMap((v) => {
                                  const r = currentReview(inv, v);
                                  return r
                                    ? [
                                        {
                                          value: r.id,
                                          label: `${inv.actions.find((a) => a.id === v.actionId)?.title} · ${r.approvedAt}`,
                                        },
                                      ]
                                    : [];
                                }),
                                required: true,
                              },
                            ],
                            command: (f) => ({
                              type: "approve_lesson",
                              id: l.id,
                              reviewId: val(f, "reviewId"),
                            }),
                          })
                        }
                      >
                        Approve lesson
                      </button>
                    )}
                  </article>
                );
              })}
            </>
          )}
          {section === "history" && (
            <article className="co-card">
              <h2>Decision history</h2>
              {inv.verificationReviews.map((r) => (
                <details
                  key={r.id}
                  open={sourceReview === r.id ? true : undefined}
                >
                  <summary>
                    {r.invalidatedAt ? "Withdrawn" : "Recorded"} approval ·{" "}
                    {name(r.approvedBy)} · {r.approvedAt}
                  </summary>
                  <p>
                    Review {r.id} · reopening event{" "}
                    {r.reopenedEventId ?? "none"}
                  </p>
                  <pre>{r.snapshot}</pre>
                  {row.document.reviewDependencies[r.id] && (
                    <details>
                      <summary>
                        Source versions and observations reviewed
                      </summary>
                      <pre>
                        {row.document.reviewDependencies[r.id].snapshot}
                      </pre>
                    </details>
                  )}
                </details>
              ))}
              {inv.history.map((h) => (
                <p key={h.id}>
                  {h.at} · {h.type.replaceAll("_", " ")} · {h.note}
                </p>
              ))}
              {row.document.provenance && (
                <p className="co-notice">
                  Imported local history is retained as untrusted provenance in
                  export. Original checksum: {row.document.provenance.checksum}
                </p>
              )}
            </article>
          )}
        </div>
        <aside className="co-card co-next">
          <h2>
            {blockers.length ? "What needs attention" : "Ready for a decision"}
          </h2>
          {blockers.length ? (
            <ul>
              {blockers.map((b, i) => (
                <li key={i}>
                  <button
                    onClick={() =>
                      navigate(() => {
                        setSection(b.section);
                        setEdit(null);
                      })
                    }
                  >
                    {b.message}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>The current work satisfies closure requirements.</p>
          )}
          {me.reviewer && !readOnly && inv.status !== "closed" && (
            <button
              className="co-primary"
              disabled={busy || blockers.length > 0}
              onClick={() => command({ type: "close" })}
            >
              Close improvement
            </button>
          )}
          {canEdit && inv.status === "closed" && (
            <button
              onClick={() =>
                open({
                  key: "reopen",
                  title: "Reopen deliberately",
                  fields: [
                    {
                      name: "note",
                      label: "Reason for reopening",
                      type: "textarea",
                      required: true,
                    },
                  ],
                  command: (f) => ({ type: "reopen", note: val(f, "note") }),
                })
              }
            >
              Reopen improvement
            </button>
          )}
          {canEdit && (
            <button
              onClick={() =>
                navigate(async () => {
                  const copy = await send({ type: "duplicate" });
                  if (copy) onDuplicate(copy);
                })
              }
            >
              Duplicate saved investigation
            </button>
          )}
          {!readOnly && ["owner", "manager"].includes(me.role) && (
            <button
              onClick={() =>
                open({
                  key: "delete",
                  title: "Delete this investigation",
                  fields: [
                    {
                      name: "confirmation",
                      label:
                        "Type DELETE to remove access to this investigation and its files",
                      required: true,
                    },
                  ],
                  command: (f) => ({
                    type: "delete_record",
                    confirmation: val(f, "confirmation") as "DELETE",
                  }),
                })
              }
            >
              Delete investigation
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
