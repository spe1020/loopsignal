"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import type { Actor, Member, Org, RecordEnvelope } from "@/lib/hosted/types";
import { currentReview } from "@/lib/solve/reviews";
import { InvestigationSchema } from "@/lib/solve/schema";
import { SimpleForm, val, type Field } from "./forms";
import { RecordEditor } from "./RecordEditor";
type State = {
  actor: Actor;
  organizations: (Org & { role: string })[];
  org?: Org;
  member?: Member;
  members?: Member[];
  records?: RecordEnvelope[];
  invitations?: {
    id: string;
    email: string;
    role: string;
    reviewer: boolean;
    expires_at: string;
    revoked_at: string | null;
    accepted_at: string | null;
  }[];
  team?: { name: string; site_name: string };
};
export function CompanyWorkspace() {
  const [state, setState] = useState<State | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mode, setMode] = useState("problems"),
    [record, setRecord] = useState<RecordEnvelope | null>(null),
    [signUp, setSignUp] = useState(false),
    [signedOut, setSignedOut] = useState(false),
    [inviteToken, setInviteToken] = useState(""),
    [newProblem, setNewProblem] = useState(false),
    [busy, setBusy] = useState(false),
    [mfa, setMfa] = useState<{
      id: string;
      totp?: { qr_code: string; secret: string };
    } | null>(null);
  const [importData, setImportData] = useState<{
    raw: unknown;
    checksum: string;
    names: string[];
    counts: string;
    title: string;
    files: number;
  } | null>(null);
  const companyId = useRef<string | undefined>(undefined),
    keys = useRef(new Map<string, string>());
  const commandId = (key: string) => {
    if (!keys.current.has(key)) keys.current.set(key, crypto.randomUUID());
    return keys.current.get(key)!;
  };
  async function api(path: string, data?: unknown) {
    const response = await fetch(`/api/company/${path}`, {
      method: data === undefined ? "GET" : "POST",
      cache: "no-store",
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) setSignedOut(true);
      throw new Error(result.error ?? "Company service unavailable");
    }
    return result;
  }
  async function refresh(org = companyId.current) {
    const result = (await api(
      `state${org ? `?organizationId=${org}` : ""}`,
    )) as State;
    setState(result);
    setSignedOut(false);
    companyId.current = org;
    if (!org && result.organizations.length) {
      companyId.current = result.organizations[0].id;
      await refresh(result.organizations[0].id);
    }
  }
  useEffect(() => {
    let active = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "invite",
    );
    if (token) {
      queueMicrotask(() => setInviteToken(token));
      window.history.replaceState(null, "", window.location.pathname);
    }
    void fetch("/api/company/state", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!active) return;
        if (!r.ok) {
          setSignedOut(true);
          setError(data.error);
        } else {
          setState(data);
          setSignedOut(false);
          if (data.organizations[0]) {
            companyId.current =
              new URLSearchParams(window.location.search).get(
                "organizationId",
              ) ?? data.organizations[0].id;
            const res = await fetch(
              `/api/company/state?organizationId=${companyId.current}`,
              { cache: "no-store" },
            );
            if (res.ok && active) {
              setState(await res.json());
              const recordId = new URLSearchParams(window.location.search).get(
                "recordId",
              );
              if (recordId) {
                const result = await fetch(
                  `/api/company/record?organizationId=${companyId.current}&recordId=${recordId}`,
                  { cache: "no-store" },
                );
                if (result.ok && active) setRecord(await result.json());
              }
            }
          }
        }
      })
      .catch(() => {
        if (active)
          setError("Company service unavailable. No browser fallback is used.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Company operation failed");
    } finally {
      setBusy(false);
    }
  }
  async function openRecord(id: string, section?: string) {
    await run(async () => {
      const r = await api(
        `record?organizationId=${companyId.current}&recordId=${id}`,
      );
      setRecord(r);
      if (section)
        setNotice(
          `Open ${section} in the investigation to work on this record.`,
        );
    });
  }
  useEffect(() => {
    const acceptHash = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "invite",
      );
      if (token) {
        setInviteToken(token);
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };
    window.addEventListener("hashchange", acceptHash);
    return () => window.removeEventListener("hashchange", acceptHash);
  }, []);
  useEffect(() => {
    if (loading) return;
    const query = record
      ? `?organizationId=${record.org_id}&recordId=${record.id}`
      : companyId.current
        ? `?organizationId=${companyId.current}`
        : "";
    window.history.replaceState(null, "", `/company${query}`);
  }, [record, loading]);
  const org = state?.org,
    me = state?.member,
    members = state?.members ?? [],
    records = state?.records ?? [];
  const canEdit = me && ["owner", "manager", "collaborator"].includes(me.role),
    canReport = canEdit || me?.role === "participant",
    isAdmin = me && ["owner", "manager"].includes(me.role);
  const planFields: Field[] = [
    { name: "name", label: "Company name", required: true },
    { name: "site", label: "Initial site", required: true },
    { name: "team", label: "Initial team", required: true },
  ];
  const name = (id?: string) =>
    members.find((m) => m.user_id === id)?.display_name ?? id ?? "Unassigned";
  return (
    <div className="company-app">
      <a className="co-skip" href="#company-content">
        Skip to workspace
      </a>
      <header className="co-header">
        <Logo />
        <span className="co-private">Private company workspace</span>
        <Link href="/workspace">Public example ↗</Link>
        {state && !signedOut && !record && (
          <button
            onClick={() =>
              run(async () => {
                await api("auth/sign-out", {});
                setState(null);
                setSignedOut(true);
              })
            }
          >
            Sign out
          </button>
        )}
      </header>
      <div className="co-evaluation">
        Synthetic evaluation · test access only · no real customer data or live
        charges
      </div>
      <main id="company-content" className="co-main">
        {loading ? (
          <div className="co-empty" role="status">
            Checking your company session…
          </div>
        ) : record && me ? (
          <RecordEditor
            key={record.id}
            initial={record}
            me={me}
            members={members}
            api={api}
            onBack={() => {
              setRecord(null);
              void run(() => refresh());
            }}
            onRecord={(r) => {
              setState((s) =>
                s
                  ? {
                      ...s,
                      records: s.records?.map((old) =>
                        old.id === r.id ? r : old,
                      ),
                    }
                  : s,
              );
            }}
            onDuplicate={(r) => setRecord(r)}
          />
        ) : (
          <>
            {error && (
              <div role="alert" className="co-error">
                {error}
                <button onClick={() => run(() => refresh())}>
                  Retry connection
                </button>
              </div>
            )}
            {notice && (
              <div role="status" className="co-notice">
                {notice}
              </div>
            )}
            {signedOut || !state ? (
              <div className="co-auth">
                <div>
                  <p className="co-eyebrow">
                    LoopSignal for manufacturing teams
                  </p>
                  <h1>Turn daily problems into improvements that last.</h1>
                  <p>
                    Sign in to the separate company environment. Company records
                    are shared only with current members. Start with a problem;
                    add investigation detail as you learn.
                  </p>
                  <p>
                    Prefer a walkthrough?{" "}
                    <Link href="/workspace">Open the fictional example</Link>.
                  </p>
                </div>
                <section className="co-card">
                  <h2>
                    {signUp ? "Create your synthetic account" : "Sign in"}
                  </h2>
                  <fieldset disabled={busy}>
                    <SimpleForm
                      fields={[
                        {
                          name: "email",
                          label: "Email",
                          type: "email",
                          required: true,
                          hint: signUp
                            ? "Use a synthetic .test address with the local email sink."
                            : undefined,
                        },
                        {
                          name: "password",
                          label: "Password (12 or more characters)",
                          type: "password",
                          required: true,
                        },
                      ]}
                      label={signUp ? "Create account" : "Sign in"}
                      onSubmit={(f) =>
                        run(async () => {
                          const result = await api(
                            signUp ? "auth/sign-up" : "auth/sign-in",
                            {
                              email: val(f, "email"),
                              password: val(f, "password"),
                            },
                          );
                          if (result.confirmationRequired) {
                            setNotice(
                              "Check the local email sink to confirm this synthetic account.",
                            );
                            return;
                          }
                          if (result.factors?.length) {
                            setMfa({ id: result.factors[0].id });
                            setNotice(
                              "Enter your authenticator code to complete sign-in.",
                            );
                            return;
                          }
                          await refresh();
                        })
                      }
                    />
                  </fieldset>
                  <button onClick={() => setSignUp(!signUp)}>
                    {signUp
                      ? "Already have an account? Sign in"
                      : "Create a test account"}
                  </button>
                  {mfa && (
                    <SimpleForm
                      label="Verify authenticator"
                      fields={[
                        {
                          name: "code",
                          label: "Six-digit code",
                          required: true,
                        },
                      ]}
                      onSubmit={(f) =>
                        run(async () => {
                          await api("auth/mfa-verify", {
                            factorId: mfa.id,
                            code: val(f, "code"),
                          });
                          setMfa(null);
                          await refresh();
                        })
                      }
                    />
                  )}
                </section>
              </div>
            ) : (
              <>
                {inviteToken && (
                  <section className="co-card">
                    <h2>Join your colleague’s company</h2>
                    <p>
                      Signed in as {state.actor.email}. The invitation is bound
                      to its recipient, role, company, and expiry.
                    </p>
                    <button
                      className="co-primary"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const r = await api("invitations/accept", {
                            token: inviteToken,
                          });
                          setInviteToken("");
                          await refresh(r.id);
                        })
                      }
                    >
                      Accept invitation
                    </button>
                  </section>
                )}
                {!org ? (
                  <section className="co-setup co-card">
                    <p className="co-eyebrow">
                      Start with one site and one team
                    </p>
                    <h1>Create your company workspace</h1>
                    <p>
                      A 14-day synthetic evaluation includes up to 10 full
                      collaborators plus lightweight internal reporting and
                      assigned-action participation. No payment is required to
                      evaluate.
                    </p>
                    <SimpleForm
                      fields={planFields}
                      label="Create company workspace"
                      onSubmit={(f) =>
                        run(async () => {
                          const data = {
                            name: val(f, "name"),
                            site: val(f, "site"),
                            team: val(f, "team"),
                          };
                          const r = await api("organizations", {
                            ...data,
                            commandId: commandId(JSON.stringify(data)),
                          });
                          await refresh(r.id);
                        })
                      }
                    />
                  </section>
                ) : (
                  <>
                    <div className="co-title">
                      <p className="co-eyebrow">
                        {state.team?.site_name} / {state.team?.name}
                      </p>
                      <h1>{org.name}</h1>
                      <p>
                        {me?.role.replaceAll("_", " ")}
                        {me?.reviewer ? " · authorized reviewer" : ""} ·{" "}
                        {org.billing_state.replaceAll("_", " ")}
                      </p>
                      {state.organizations.length > 1 && (
                        <label className="co-field">
                          Company
                          <select
                            value={org.id}
                            onChange={(e) => run(() => refresh(e.target.value))}
                          >
                            {state.organizations.map((o) => (
                              <option value={o.id} key={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                    <nav className="co-tabs" aria-label="Company views">
                      {[
                        "problems",
                        "actions",
                        "results",
                        "lessons",
                        "team",
                        "import",
                        "billing",
                        "security",
                      ].map((m) => (
                        <button
                          key={m}
                          aria-current={mode === m ? "page" : undefined}
                          onClick={() => setMode(m)}
                        >
                          {m[0].toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </nav>
                    <fieldset disabled={busy}>
                      {mode === "problems" && (
                        <>
                          <div className="co-toolbar">
                            <h2>Problems worth solving</h2>
                            {canReport && (
                              <button
                                className="co-primary"
                                onClick={() => setNewProblem(!newProblem)}
                              >
                                Record a problem
                              </button>
                            )}
                            <button onClick={() => run(() => refresh())}>
                              Reload shared records
                            </button>
                          </div>
                          <SimpleForm
                            label="Search company"
                            fields={[
                              { name: "query", label: "Search problems" },
                            ]}
                            onSubmit={(f) =>
                              run(async () => {
                                setState(
                                  await api(
                                    `state?organizationId=${org.id}&q=${encodeURIComponent(val(f, "query"))}`,
                                  ),
                                );
                              })
                            }
                          />
                          {newProblem && (
                            <section className="co-card">
                              <h2>Start with what happened</h2>
                              <SimpleForm
                                label="Save first problem"
                                fields={[
                                  {
                                    name: "title",
                                    label: "Short title",
                                    required: true,
                                  },
                                  {
                                    name: "whatHappened",
                                    label: "What happened?",
                                    type: "textarea",
                                    required: true,
                                  },
                                  { name: "where", label: "Where?" },
                                ]}
                                onSubmit={(f) =>
                                  run(async () => {
                                    const data = {
                                      title: val(f, "title"),
                                      whatHappened: val(f, "whatHappened"),
                                      where: val(f, "where"),
                                      whatShouldHaveHappened: "",
                                      impact: "",
                                    };
                                    const id = commandId(JSON.stringify(data));
                                    const r = await api("commands", {
                                      version: 1,
                                      organizationId: org.id,
                                      commandId: id,
                                      correlationId: id,
                                      recordId: null,
                                      expectedRevision: 0,
                                      command: { type: "create_problem", data },
                                    });
                                    setRecord(r);
                                    setNewProblem(false);
                                    await refresh();
                                  })
                                }
                              />
                            </section>
                          )}
                          {!records.length && (
                            <div className="co-empty">
                              <h3>No problems recorded yet</h3>
                              <p>
                                Capture a specific observation. You can add
                                evidence and assign work next.
                              </p>
                            </div>
                          )}
                          <div className="co-list">
                            {records.map((r) => (
                              <button
                                className="co-record-link"
                                key={r.id}
                                onClick={() => openRecord(r.id)}
                              >
                                <span>
                                  <small>
                                    {r.document.investigation.rcaNumber}
                                  </small>
                                  <strong>
                                    {r.document.investigation.title}
                                  </strong>
                                  <span>
                                    {r.document.investigation.problem.where}
                                  </span>
                                </span>
                                <span>
                                  {r.document.investigation.status.replaceAll(
                                    "_",
                                    " ",
                                  )}{" "}
                                  →
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {mode === "actions" && (
                        <>
                          <h2>Your assigned work</h2>
                          <p>
                            Open the source investigation to contribute evidence
                            and update the action.
                          </p>
                          {records.flatMap((r) =>
                            r.document.investigation.actions
                              .filter((a) => a.owner === state.actor.id)
                              .map((a) => (
                                <button
                                  className="co-record-link"
                                  key={a.id}
                                  onClick={() => openRecord(r.id, "Actions")}
                                >
                                  <span>
                                    <strong>{a.title}</strong>
                                    <small>
                                      {r.document.investigation.title} ·{" "}
                                      {a.dueDate || "No due date"}
                                    </small>
                                  </span>
                                  <span>{a.status.replaceAll("_", " ")} →</span>
                                </button>
                              )),
                          )}
                          <h3>All team actions</h3>
                          {records.flatMap((r) =>
                            r.document.investigation.actions.map((a) => (
                              <button
                                className="co-record-link"
                                key={a.id}
                                onClick={() => openRecord(r.id, "Actions")}
                              >
                                <span>
                                  <strong>{a.title}</strong>
                                  <small>
                                    {name(a.owner)} ·{" "}
                                    {r.document.investigation.title}
                                  </small>
                                </span>
                                <span>{a.status.replaceAll("_", " ")} →</span>
                              </button>
                            )),
                          )}
                        </>
                      )}
                      {mode === "results" && (
                        <>
                          <h2>Results linked to their source</h2>
                          <p>
                            Measurements and approvals come from the company’s
                            investigations.
                          </p>
                          {records.flatMap((r) =>
                            r.document.investigation.verifications.map((v) => {
                              const review = currentReview(
                                r.document.investigation,
                                v,
                              );
                              return (
                                <button
                                  className="co-record-link"
                                  key={v.id}
                                  onClick={() => openRecord(r.id, "Results")}
                                >
                                  <span>
                                    <strong>{v.observed}</strong>
                                    <small>
                                      {r.document.investigation.title} ·{" "}
                                      {v.checkAt} · {v.evidenceIds.length}{" "}
                                      sources
                                    </small>
                                  </span>
                                  <span>
                                    {review
                                      ? "Reviewed"
                                      : v.result.replaceAll("_", " ")}{" "}
                                    →
                                  </span>
                                </button>
                              );
                            }),
                          )}
                        </>
                      )}
                      {mode === "lessons" && (
                        <>
                          <h2>Learning the team can revisit</h2>
                          <p>
                            Historical learning remains visible when current
                            approval is withdrawn.
                          </p>
                          {records.flatMap((r) =>
                            r.document.investigation.lessons.map((l) => {
                              const i = r.document.investigation,
                                v = i.verifications.find(
                                  (v) => v.id === l.sourceVerificationId,
                                ),
                                approved =
                                  i.status === "closed" &&
                                  v &&
                                  currentReview(i, v)?.id ===
                                    l.sourceReviewId &&
                                  l.approvedAt;
                              return (
                                <button
                                  className="co-record-link"
                                  key={l.id}
                                  onClick={() => openRecord(r.id, "Lessons")}
                                >
                                  <span>
                                    <strong>{l.lesson}</strong>
                                    <small>{i.title}</small>
                                  </span>
                                  <span>
                                    {approved
                                      ? "Approved learning"
                                      : "Retained · approval required"}{" "}
                                    →
                                  </span>
                                </button>
                              );
                            }),
                          )}
                        </>
                      )}
                      {mode === "team" && (
                        <>
                          <h2>People and access</h2>
                          <p>
                            Full seats:{" "}
                            {
                              members.filter(
                                (m) =>
                                  !m.revoked_at &&
                                  ["owner", "manager", "collaborator"].includes(
                                    m.role,
                                  ),
                              ).length
                            }{" "}
                            / {org.seats}. Unexpired full-seat invitations also
                            reserve capacity. Reviewer authority is granted
                            separately.
                          </p>
                          {members.map((m) => (
                            <article className="co-card" key={m.user_id}>
                              <h3>{m.display_name}</h3>
                              <p>
                                {m.role.replaceAll("_", " ")}
                                {m.reviewer ? " · reviewer" : ""}
                                {m.revoked_at ? " · revoked" : ""}
                              </p>
                              {isAdmin && (
                                <SimpleForm
                                  label="Save member access"
                                  fields={[
                                    {
                                      name: "role",
                                      label: "Role",
                                      type: "select",
                                      value: m.role,
                                      options: (m.role === "owner"
                                        ? ["owner"]
                                        : [
                                            "billing_admin",
                                            "manager",
                                            "collaborator",
                                            "participant",
                                            "viewer",
                                          ]
                                      ).map((value) => ({
                                        value,
                                        label: value.replaceAll("_", " "),
                                      })),
                                    },
                                    {
                                      name: "reviewer",
                                      label: "Explicit reviewer authority",
                                      type: "checkbox",
                                      value: m.reviewer,
                                    },
                                    {
                                      name: "revoke",
                                      label: "Revoke membership",
                                      type: "checkbox",
                                      value: Boolean(m.revoked_at),
                                    },
                                  ]}
                                  onSubmit={(f) =>
                                    run(async () => {
                                      await api("members", {
                                        organizationId: org.id,
                                        userId: m.user_id,
                                        role: val(f, "role"),
                                        reviewer: f.has("reviewer"),
                                        revoke: f.has("revoke"),
                                        commandId: crypto.randomUUID(),
                                      });
                                      await refresh();
                                    })
                                  }
                                />
                              )}
                            </article>
                          ))}
                          {isAdmin && (
                            <section className="co-card">
                              <h3>Invite a colleague</h3>
                              <SimpleForm
                                label="Create synthetic invitation"
                                fields={[
                                  {
                                    name: "email",
                                    label: "Colleague’s synthetic email",
                                    type: "email",
                                    required: true,
                                  },
                                  {
                                    name: "role",
                                    label: "Access",
                                    type: "select",
                                    value: "collaborator",
                                    options: [
                                      "collaborator",
                                      "participant",
                                      "viewer",
                                      "manager",
                                      "billing_admin",
                                    ].map((value) => ({
                                      value,
                                      label: value.replaceAll("_", " "),
                                    })),
                                  },
                                  {
                                    name: "reviewer",
                                    label: "Grant explicit reviewer authority",
                                    type: "checkbox",
                                  },
                                ]}
                                onSubmit={(f) =>
                                  run(async () => {
                                    const data = {
                                      organizationId: org.id,
                                      email: val(f, "email"),
                                      role: val(f, "role"),
                                      reviewer: f.has("reviewer"),
                                    };
                                    await api("invitations", {
                                      ...data,
                                      commandId: commandId(
                                        JSON.stringify(data),
                                      ),
                                    });
                                    await refresh();
                                    setNotice(
                                      "Invitation queued. Deliver it to the local email sink below.",
                                    );
                                  })
                                }
                              />
                              <button
                                onClick={() =>
                                  run(async () => {
                                    const result = await api("jobs", {
                                      organizationId: org.id,
                                    });
                                    setNotice(
                                      `${result.complete} of ${result.processed} queued operations completed. Failed delivery stays queued for retry.`,
                                    );
                                  })
                                }
                              >
                                Deliver queued invitations / retry jobs
                              </button>
                              {state.invitations?.map((i) => (
                                <div className="co-file" key={i.id}>
                                  <span>
                                    {i.email} · {i.role} ·{" "}
                                    {i.revoked_at
                                      ? "revoked"
                                      : i.accepted_at
                                        ? "accepted"
                                        : `expires ${new Date(i.expires_at).toLocaleDateString()}`}
                                  </span>
                                  {!i.revoked_at && !i.accepted_at && (
                                    <button
                                      onClick={() =>
                                        run(async () => {
                                          await api("invitations/revoke", {
                                            organizationId: org.id,
                                            id: i.id,
                                          });
                                          await refresh();
                                        })
                                      }
                                    >
                                      Revoke invitation
                                    </button>
                                  )}
                                </div>
                              ))}
                            </section>
                          )}
                        </>
                      )}
                      {mode === "import" && (
                        <section className="co-card">
                          <h2>Explicit device-to-company import</h2>
                          <p>
                            Destination: <strong>{org.name}</strong> /{" "}
                            {state.team?.name}. Originals stay on your device.
                            Local approval names and history cannot establish
                            company approval.
                          </p>
                          {canEdit ? (
                            <>
                              <label className="co-field">
                                Choose a LoopSolve JSON export
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={(event) =>
                                    run(async () => {
                                      const file =
                                        event.currentTarget.files?.[0];
                                      if (!file) return;
                                      if (file.size > 2000000)
                                        throw new Error(
                                          "Import is limited to 2 MB of JSON",
                                        );
                                      const raw = JSON.parse(await file.text()),
                                        i = InvestigationSchema.parse(raw);
                                      if (i.schemaVersion !== 1)
                                        throw new Error(
                                          "Unsupported schema version",
                                        );
                                      const bytes = new TextEncoder().encode(
                                          JSON.stringify(raw),
                                        ),
                                        digest = await crypto.subtle.digest(
                                          "SHA-256",
                                          bytes,
                                        );
                                      setImportData({
                                        raw,
                                        checksum: [...new Uint8Array(digest)]
                                          .map((v) =>
                                            v.toString(16).padStart(2, "0"),
                                          )
                                          .join(""),
                                        names: [
                                          ...new Set(
                                            [
                                              ...i.actions.map((a) => a.owner),
                                              ...i.containment.map(
                                                (c) => c.owner,
                                              ),
                                            ].filter((s): s is string =>
                                              Boolean(s),
                                            ),
                                          ),
                                        ],
                                        counts: `${i.evidence.length} evidence · ${i.causes.length} causes · ${i.actions.length} actions · ${i.verifications.length} results · ${i.lessons.length} lessons`,
                                        title: i.title,
                                        files: i.evidence.filter((e) =>
                                          ["document", "photo_ref"].includes(
                                            e.type,
                                          ),
                                        ).length,
                                      });
                                    })
                                  }
                                />
                              </label>
                              {importData && (
                                <>
                                  <h3>{importData.title}</h3>
                                  <p>{importData.counts}</p>
                                  <p>
                                    {importData.files} file references need
                                    explicit upload after record import. Missing
                                    sources remain unresolved and block
                                    approval.
                                  </p>
                                  <p className="co-muted">
                                    Checksum: {importData.checksum}
                                  </p>
                                  <SimpleForm
                                    label={`Confirm import into ${org.name}`}
                                    fields={importData.names.map((name, i) => ({
                                      name: `owner-${i}`,
                                      label: `Map local owner: ${name}`,
                                      type: "select",
                                      options: [
                                        {
                                          value: "",
                                          label: "Leave unassigned",
                                        },
                                        ...members
                                          .filter((m) => !m.revoked_at)
                                          .map((m) => ({
                                            value: m.user_id,
                                            label: m.display_name,
                                          })),
                                      ],
                                    }))}
                                    onSubmit={(f) =>
                                      run(async () => {
                                        const mapping = Object.fromEntries(
                                          importData.names.map((n, i) => [
                                            n,
                                            val(f, `owner-${i}`) || null,
                                          ]),
                                        );
                                        const r = await api("import", {
                                          organizationId: org.id,
                                          commandId: commandId(
                                            importData.checksum +
                                              JSON.stringify(mapping),
                                          ),
                                          checksum: importData.checksum,
                                          mapping,
                                          document: importData.raw,
                                          confirmed: true,
                                        });
                                        setRecord(r);
                                        setImportData(null);
                                        await refresh();
                                      })
                                    }
                                  />
                                </>
                              )}
                            </>
                          ) : (
                            <p>A full collaborator can import a document.</p>
                          )}
                        </section>
                      )}
                      {mode === "billing" && (
                        <section className="co-card">
                          <p className="co-eyebrow">Team · test mode</p>
                          <h2>$299 / month</h2>
                          <p>
                            A pricing hypothesis for synthetic evaluation, not
                            validated market pricing. One site, one team
                            workspace, 10 full collaborators, and lightweight
                            internal reporting, viewing, and assigned-action
                            participation without a per-reporter fee.
                          </p>
                          <p>
                            Current state: <strong>{org.billing_state}</strong>.
                            Evaluation ends{" "}
                            {new Date(
                              org.evaluation_ends_at,
                            ).toLocaleDateString()}
                            .
                            {org.grace_ends_at &&
                              ` Read/export grace ends ${new Date(org.grace_ends_at).toLocaleDateString()}.`}
                          </p>
                          <p>
                            Core authorization, private storage, and recovery
                            are included. Past-due or cancelled access becomes
                            read-only; existing work is preserved.
                          </p>
                          {me &&
                            ["owner", "billing_admin"].includes(me.role) && (
                              <>
                                <button
                                  className="co-primary"
                                  onClick={() =>
                                    run(async () => {
                                      const r = await api("billing/checkout", {
                                        organizationId: org.id,
                                        commandId: commandId(
                                          `checkout-${org.id}`,
                                        ),
                                      });
                                      window.location.assign(r.url);
                                    })
                                  }
                                >
                                  Open Stripe test checkout
                                </button>
                                <button
                                  onClick={() =>
                                    run(async () => {
                                      const r = await api("billing/portal", {
                                        organizationId: org.id,
                                        commandId: crypto.randomUUID(),
                                      });
                                      window.location.assign(r.url);
                                    })
                                  }
                                >
                                  Manage test subscription
                                </button>
                                <button
                                  onClick={() =>
                                    run(async () => {
                                      await api("billing/reconcile", {
                                        organizationId: org.id,
                                      });
                                      await refresh();
                                    })
                                  }
                                >
                                  Refresh subscription status
                                </button>
                              </>
                            )}
                        </section>
                      )}
                      {mode === "security" && (
                        <section className="co-card">
                          <h2>Account security</h2>
                          <p>
                            Company membership is checked again for every
                            request. TOTP adds an authenticator requirement to
                            your account.
                          </p>
                          <button
                            onClick={() =>
                              run(async () => {
                                setMfa(await api("auth/mfa-enroll", {}));
                              })
                            }
                          >
                            Set up authenticator
                          </button>
                          {mfa && (
                            <>
                              <p>
                                Enter this secret in your authenticator:{" "}
                                <code>{mfa.totp?.secret}</code>
                              </p>
                              <SimpleForm
                                label="Verify and enable authenticator"
                                fields={[
                                  {
                                    name: "code",
                                    label: "Six-digit code",
                                    required: true,
                                  },
                                ]}
                                onSubmit={(f) =>
                                  run(async () => {
                                    await api("auth/mfa-verify", {
                                      factorId: mfa.id,
                                      code: val(f, "code"),
                                    });
                                    setMfa(null);
                                    setNotice("Authenticator verified.");
                                  })
                                }
                              />
                            </>
                          )}
                          <p>
                            No company records are persisted to localStorage or
                            IndexedDB. Use explicit recovery export before
                            closing an unsaved editor.
                          </p>
                        </section>
                      )}
                    </fieldset>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer className="co-footer">
        <span>LoopSignal · evidence, action, learning.</span>
        <Link href="/trust">Trust and pilot readiness</Link>
      </footer>
    </div>
  );
}
