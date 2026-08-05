import { createFileRoute } from "@tanstack/react-router";
import { Bot, Check, Clock, Lock, RefreshCcw, RotateCcw, TimerReset, User, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import {
  CitationChip,
  DemoDownloadButton,
  EmptyState,
  KeyValue,
  MetricCard,
  NoticeBanner,
  SectionCard,
} from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import { PermissionButton, RoleAccessNotice } from "@/components/app/permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { correctionTrace } from "@/demo-data/audit";
import {
  correctionStages,
  stageIndex,
  statusTone,
  type CorrectionRequest,
} from "@/demo-data/corrections";
import { useDemoState } from "@/demo-data/store";
import {
  buildTimeline,
  formatDuration,
  slaSummary,
  slaTargetHours,
} from "@/demo-data/correction-timeline";
import {
  mandateTypes,
  ruleFor,
  ruleSummary,
  type MandateType,
} from "@/demo-data/signoff-rules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import type { AuditEventView } from "@/demo-data/types";
import { cn } from "@/lib/utils";

const TITLE = "Audit and lineage - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Append-only synthetic audit trail showing human, agent and sync actions with reasons, trace IDs and correction-by-reversal lineage.";

export const Route = createFileRoute("/audit/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const ACTOR_FILTERS = ["All", "Human", "Agent", "Sync", "System"] as const;
type ActorFilter = (typeof ACTOR_FILTERS)[number];

const actorMeta: Record<
  AuditEventView["actorType"],
  { tone: "info" | "warning" | "neutral" | "success"; icon: typeof User }
> = {
  Human: { tone: "success", icon: User },
  Agent: { tone: "info", icon: Bot },
  Sync: { tone: "warning", icon: RefreshCcw },
  System: { tone: "neutral", icon: Workflow },
};

/** Compact three-step progress indicator for one correction request. */
function Stepper({ request }: { request: CorrectionRequest }) {
  const reached = stageIndex(request.status);
  const rejected = request.status === "Rejected";
  const required = request.rule.requiredApprovals;
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-2">
      {correctionStages.map((s, i) => {
        const done = !rejected && (i < reached || request.status === "Applied");
        const current = !rejected && i === reached && request.status !== "Applied";
        const label =
          s.key === "Sign-off" ? `${s.label} (${request.signOffs.length}/${required})` : s.label;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "tnum inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
                done && "border-success/25 bg-success-surface text-success",
                current && "border-info/25 bg-info-surface text-info",
                !done && !current && "border-border bg-secondary text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5 shrink-0" aria-hidden /> : `${i + 1}.`} {label}
            </span>
            {i < correctionStages.length - 1 && (
              <span className="text-xs text-muted-foreground" aria-hidden>
                -&gt;
              </span>
            )}
          </li>
        );
      })}
      {rejected && <StatusBadge label="Rejected at sign-off" tone="danger" />}
    </ol>
  );
}

/** Stage-by-stage timeline with timestamps and per-hand-off SLA indicators. */
function CorrectionTimeline({
  request,
  nowMs,
}: {
  request: CorrectionRequest;
  nowMs: number;
}) {
  const rows = buildTimeline(request, nowMs);
  return (
    <ol className="mt-3 space-y-3 border-t border-border pt-3">
      {rows.map((row) => (
        <li key={row.key} className="flex gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
              row.pending
                ? "border-dashed border-border bg-secondary text-muted-foreground"
                : "border-success/25 bg-success-surface text-success",
            )}
            aria-hidden
          >
            {row.pending ? <Clock className="size-3.5" /> : <Check className="size-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-navy">{row.label}</span>
              <span className="tnum text-xs text-muted-foreground">{row.at}</span>
              {row.elapsedMs !== null && (
                <StatusBadge
                  label={
                    row.targetHours === null
                      ? formatDuration(row.elapsedMs)
                      : `${formatDuration(row.elapsedMs)} / ${row.targetHours}h target`
                  }
                  tone={row.tone}
                />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.pending ? row.role : `${row.actor} (${row.role})`}
              {row.note ? ` · ${row.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Page() {
  const {
    auditEvents,
    resetDemo,
    correctionRequests,
    requestCorrection,
    signOffCorrection,
    rejectCorrection,
    applyCorrection,
    correctionBlocker,
    signOffRules,
  } = useDemoState();
  const [actor, setActor] = useState<ActorFilter>("All");
  const [query, setQuery] = useState("");
  const [trace, setTrace] = useState<string | null>(null);
  const [correctionRef, setCorrectionRef] = useState("EFF-2291");
  const [correctionChange, setCorrectionChange] = useState(
    "Reassign the entry to the correct module",
  );
  const [correctionReason, setCorrectionReason] = useState("");
  const [mandateType, setMandateType] = useState<MandateType>("Audit event");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Keeps the in-stage waiting time and SLA badges ticking during the demo.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const activeRule = ruleFor(signOffRules, mandateType);

  const pendingSignOff = correctionRequests.filter((r) => r.status === "Awaiting sign-off").length;
  const awaitingApply = correctionRequests.filter((r) => r.status === "Signed off").length;
  const slaBreaches = correctionRequests.filter((r) => slaSummary(r, nowMs).breached).length;

  const q = query.trim().toLowerCase();
  const events = useMemo(
    () =>
      auditEvents.filter(
        (e) =>
          (actor === "All" || e.actorType === actor) &&
          (trace === null || e.traceId === trace) &&
          (q === "" ||
            e.action.toLowerCase().includes(q) ||
            e.actor.toLowerCase().includes(q) ||
            e.objectRef.toLowerCase().includes(q) ||
            e.traceId.toLowerCase().includes(q)),
      ),
    [auditEvents, actor, trace, q],
  );

  const counts = useMemo(
    () => ({
      total: auditEvents.length,
      human: auditEvents.filter((e) => e.actorType === "Human").length,
      agent: auditEvents.filter((e) => e.actorType === "Agent").length,
      autoRejected: auditEvents.filter((e) => e.beforeAfter.includes("auto-rejected")).length,
    }),
    [auditEvents],
  );

  const correctionChain = auditEvents
    .filter((e) => e.traceId === correctionTrace)
    .slice()
    .reverse();

  const csv = [
    "id,timestamp,actor,actor type,action,object type,object ref,before -> after,reason,trace id",
    ...events.map((e) =>
      [
        e.id,
        `"${e.timestamp}"`,
        `"${e.actor}"`,
        e.actorType,
        `"${e.action}"`,
        `"${e.objectType}"`,
        `"${e.objectRef}"`,
        `"${e.beforeAfter}"`,
        `"${e.reason}"`,
        e.traceId,
      ].join(","),
    ),
  ].join("\n");

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Audit and lineage" }]}
        title="Audit and lineage"
        subtitle="Every synthetic action is appended with an actor, a reason and a trace ID. Records are never edited or deleted: mistakes are corrected by reversal."
        secondary={
          <DemoDownloadButton filename="synthetic-audit-trail.csv" content={csv} label="Export trail" />
        }
        primary={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              resetDemo();
              setTrace(null);
              setActor("All");
              setQuery("");
              toast.success("Demo session reset", {
                description: "Session decisions cleared; seeded synthetic history retained.",
              });
            }}
          >
            <RotateCcw className="size-4" aria-hidden /> Reset demo session
          </Button>
        }
      />

      <div className="mb-4">
        <RoleAccessNotice
          permissions={["correction.request", "correction.signoff", "audit.correct"]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Audit events" value={counts.total} hint="Seeded history plus this session's actions" />
        <MetricCard
          label="Human decisions"
          value={counts.human}
          hint="Named reviewer actions with recorded reasons"
          onClick={() => setActor("Human")}
          active={actor === "Human"}
        />
        <MetricCard
          label="Agent drafts"
          value={counts.agent}
          hint="Agent runs, all created as drafts only"
          onClick={() => setActor("Agent")}
          active={actor === "Agent"}
        />
        <MetricCard
          label="Corrections in flight"
          value={pendingSignOff + awaitingApply}
          hint={`${pendingSignOff} awaiting sign-off, ${awaitingApply} ready to apply · ${slaBreaches} past SLA target`}
        />
      </div>

      <div className="mt-6 space-y-6">
        <NoticeBanner
          tone="info"
          icon={<Lock className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />}
        >
          <span className="font-semibold">Append-only by design (simulated). </span>
          No entry in this trail can be edited or removed. Corrections appear as a reversing entry
          followed by a corrected entry, sharing one trace ID.
        </NoticeBanner>

        <SectionCard
          title="Correction by reversal"
          description={`Worked example on trace ${correctionTrace}: an effort entry booked against the wrong module.`}
          actions={
            <Button size="sm" variant="outline" onClick={() => setTrace(correctionTrace)}>
              Filter trail to this trace
            </Button>
          }
        >
          <ol className="space-y-3">
            {correctionChain.map((e, i) => (
              <li key={e.id} className="flex gap-3">
                <span className="tnum mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-navy">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{e.action}</p>
                  <p className="tnum text-xs text-muted-foreground">
                    {e.objectRef} · {e.beforeAfter} · {e.timestamp}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Reason: {e.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Raise a correction request"
          description="Corrections are never applied by one actor. Step 1 raises the request; a different reviewer must sign it off before the reversal is appended."
        >
          <ol className="mb-5 grid gap-3 sm:grid-cols-3">
            {correctionStages.map((s, i) => (
              <li key={s.key} className="rounded-lg border border-border px-4 py-3">
                <p className="tnum text-xs font-semibold text-primary">Step {i + 1}</p>
                <p className="text-sm font-semibold text-navy">{s.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.help}</p>
              </li>
            ))}
          </ol>
          <div className="grid gap-3 sm:max-w-xl">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                htmlFor="correction-mandate"
              >
                Mandate type
              </label>
              <Select
                value={mandateType}
                onValueChange={(v) => setMandateType(v as MandateType)}
              >
                <SelectTrigger id="correction-mandate" aria-label="Mandate type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mandateTypes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sign-off rule: {ruleSummary(activeRule)}.{" "}
                <Link to="/roles" className="text-primary underline-offset-4 hover:underline">
                  Configure rules
                </Link>
              </p>
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                htmlFor="correction-ref"
              >
                Object reference to correct
              </label>
              <Input
                id="correction-ref"
                value={correctionRef}
                onChange={(e) => setCorrectionRef(e.target.value)}
                placeholder="e.g. EFF-2291"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                htmlFor="correction-change"
              >
                Proposed change
              </label>
              <Input
                id="correction-change"
                value={correctionChange}
                onChange={(e) => setCorrectionChange(e.target.value)}
                placeholder="What the corrected value should be"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                htmlFor="correction-reason"
              >
                Reason (required)
              </label>
              <Textarea
                id="correction-reason"
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain what was wrong and what the corrected value should be."
              />
            </div>
            <div>
              <PermissionButton
                permission="correction.request"
                size="sm"
                disabled={
                  correctionRef.trim() === "" ||
                  correctionReason.trim() === "" ||
                  correctionChange.trim() === ""
                }
                onClick={() => {
                  const created = requestCorrection({
                    objectRef: correctionRef.trim(),
                    objectType: mandateType,
                    mandateType,
                    proposedChange: correctionChange.trim(),
                    reason: correctionReason.trim(),
                    traceId: correctionTrace,
                  });
                  if (created) {
                    setCorrectionReason("");
                    toast.success(`${created.id} submitted for sign-off`, {
                      description: `Nothing has changed yet. Rule for ${mandateType}: ${ruleSummary(created.rule)}.`,
                    });
                  }
                }}
              >
                Submit for sign-off
              </PermissionButton>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Correction approvals"
          description="Sign-off queue. Each request follows the rule configured for its mandate type: the required number of countersignatures, the roles allowed to give them, then application as a reversal."
          actions={
            <StatusBadge
              label={`${pendingSignOff} awaiting sign-off`}
              tone={pendingSignOff > 0 ? "warning" : "neutral"}
            />
          }
        >
          {correctionRequests.length === 0 ? (
            <EmptyState
              title="No correction requests"
              description="Raise a request above to start the multi-step approval flow."
            />
          ) : (
            <ul className="space-y-4">
              {correctionRequests.map((r) => {
                const sla = slaSummary(r, nowMs);
                return (
                <li key={r.id} className="rounded-lg border border-border px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum font-mono text-xs text-muted-foreground">{r.id}</span>
                        <StatusBadge label={r.status} tone={statusTone[r.status]} />
                        <StatusBadge label={r.mandateType} tone="neutral" />
                        <StatusBadge
                          label={`${r.signOffs.length} of ${r.rule.requiredApprovals} sign-offs`}
                          tone={
                            r.signOffs.length >= r.rule.requiredApprovals ? "success" : "warning"
                          }
                        />
                        <StatusBadge label={sla.label} tone={sla.tone} />
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-navy">{r.proposedChange}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.objectType} {r.objectRef} · raised by {r.requestedBy} · {r.requestedAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrace(r.traceId)}
                      className="tnum shrink-0 font-mono text-xs text-primary underline-offset-4 hover:underline"
                      title="Filter the trail to this trace ID"
                    >
                      {r.traceId}
                    </button>
                  </div>

                  <Stepper request={r} />

                  <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
                    <KeyValue
                      items={[
                        { label: "Reason", value: r.reason },
                        { label: "Sign-off rule", value: ruleSummary(r.rule) },
                        {
                          label: "Countersigned by",
                          value:
                            r.signOffs.length === 0
                              ? "Not yet countersigned"
                              : r.signOffs.map((s) => `${s.actor} (${s.role})`).join("; "),
                        },
                        { label: "Applied by", value: r.appliedBy ?? "Not applied" },
                        {
                          label: "Turnaround",
                          value:
                            sla.totalMs === null
                              ? "Not available"
                              : `${formatDuration(sla.totalMs)} since raised · targets: sign-off ${slaTargetHours["Sign-off"]}h, apply ${slaTargetHours.Applied}h`,
                        },
                      ]}
                    />
                    <CorrectionTimeline request={r} nowMs={nowMs} />
                  </div>

                  {(r.status === "Awaiting sign-off" || r.status === "Signed off") && (
                    <div className="mt-3 space-y-2">
                      {r.status === "Awaiting sign-off" && (
                        <Textarea
                          rows={2}
                          value={notes[r.id] ?? ""}
                          onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                          placeholder="Sign-off or rejection note (required)"
                          aria-label={`Decision note for ${r.id}`}
                        />
                      )}
                      {(() => {
                        const step = r.status === "Awaiting sign-off" ? "signoff" : "apply";
                        const blocker = correctionBlocker(r, step);
                        const note = (notes[r.id] ?? "").trim();
                        if (step === "signoff") {
                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              <PermissionButton
                                permission="correction.signoff"
                                size="sm"
                                disabled={note === "" || blocker !== null}
                                title={blocker ?? undefined}
                                onClick={() => {
                                  if (signOffCorrection(r.id, note)) {
                                    setNotes((p) => ({ ...p, [r.id]: "" }));
                                    const done = r.signOffs.length + 1;
                                    toast.success(
                                      `${r.id}: sign-off ${done} of ${r.rule.requiredApprovals} recorded`,
                                      {
                                        description:
                                          done >= r.rule.requiredApprovals
                                            ? "Rule satisfied. Ready to apply as a reversal."
                                            : `${r.rule.requiredApprovals - done} more countersignature(s) required by the ${r.mandateType} rule.`,
                                      },
                                    );
                                  }
                                }}
                              >
                                <Check className="size-3.5" aria-hidden /> Sign off
                              </PermissionButton>
                              <PermissionButton
                                permission="correction.signoff"
                                size="sm"
                                variant="outline"
                                disabled={note === "" || blocker !== null}
                                title={blocker ?? undefined}
                                onClick={() => {
                                  if (rejectCorrection(r.id, note)) {
                                    setNotes((p) => ({ ...p, [r.id]: "" }));
                                    toast.success(`${r.id} rejected`, {
                                      description: "No change was applied to the trail.",
                                    });
                                  }
                                }}
                              >
                                Reject request
                              </PermissionButton>
                              {blocker && (
                                <span className="text-xs text-warning">{blocker}</span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-wrap items-center gap-2">
                            <PermissionButton
                              permission="audit.correct"
                              size="sm"
                              disabled={blocker !== null}
                              title={blocker ?? undefined}
                              onClick={() => {
                                if (applyCorrection(r.id)) {
                                  toast.success(`${r.id} applied by reversal`, {
                                    description: `Reversing entry appended under ${r.traceId}.`,
                                  });
                                }
                              }}
                            >
                              Apply correction by reversal
                            </PermissionButton>
                            {blocker && <span className="text-xs text-warning">{blocker}</span>}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Audit trail"
          description="Newest first. Filter by actor type or search for an object reference or trace ID."
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search action, actor, object or trace"
              className="h-9 w-full sm:w-72"
              aria-label="Search audit trail"
            />
          }
          bodyClassName="px-0 py-0"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
            {ACTOR_FILTERS.map((a) => (
              <Button
                key={a}
                size="sm"
                variant={actor === a ? "default" : "outline"}
                onClick={() => setActor(a)}
              >
                {a}
              </Button>
            ))}
            {trace && (
              <Button size="sm" variant="secondary" onClick={() => setTrace(null)}>
                Trace {trace} · clear
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No matching audit events"
                description="No synthetic events match this actor filter, trace and search."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActor("All");
                      setQuery("");
                      setTrace(null);
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => {
                const meta = actorMeta[e.actorType];
                const Icon = meta.icon;
                return (
                  <li
                    key={e.id}
                    className={cn(
                      "px-5 py-4",
                      e.traceId === correctionTrace && "bg-secondary/40",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tnum font-mono text-xs text-muted-foreground">{e.id}</span>
                          <StatusBadge
                            label={e.actorType}
                            tone={meta.tone}
                            icon={<Icon className="size-3.5 shrink-0" aria-hidden />}
                            title={`Action performed by a ${e.actorType.toLowerCase()} actor`}
                          />
                          <span className="tnum text-xs text-muted-foreground">{e.timestamp}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-navy">{e.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {e.actor} · {e.objectType} · {e.objectRef}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTrace(e.traceId)}
                        className="tnum shrink-0 font-mono text-xs text-primary underline-offset-4 hover:underline"
                        title="Filter the trail to this trace ID"
                      >
                        {e.traceId}
                      </button>
                    </div>

                    <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
                      <KeyValue
                        items={[
                          { label: "Before -> after", value: e.beforeAfter },
                          { label: "Reason", value: e.reason },
                          ...(e.promptHash
                            ? [
                                {
                                  label: "Prompt hash",
                                  value: <CitationChip reference={e.promptHash} />,
                                },
                              ]
                            : []),
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <NoticeBanner tone="warning">
          Synthetic audit trail for concept demonstration. Immutability, actors and timestamps are
          simulated in the browser session and carry no legal or clinical authority.
        </NoticeBanner>
      </div>
    </>
  );
}
