import { createFileRoute } from "@tanstack/react-router";
import { Bot, Lock, RefreshCcw, RotateCcw, User, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useDemoState } from "@/demo-data/store";
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

function Page() {
  const { auditEvents, resetDemo, recordCorrection } = useDemoState();
  const [actor, setActor] = useState<ActorFilter>("All");
  const [query, setQuery] = useState("");
  const [trace, setTrace] = useState<string | null>(null);
  const [correctionRef, setCorrectionRef] = useState("EFF-2291");
  const [correctionReason, setCorrectionReason] = useState("");

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
        <RoleAccessNotice permissions={["audit.correct"]} />
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
          label="Auto-rejected citations"
          value={counts.autoRejected}
          hint="Blocked by the demo citation whitelist"
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
          title="Record a correction by reversal"
          description="Restricted action. A correction never edits history: it appends a reversing entry and a corrected entry under one trace ID."
        >
          <div className="grid gap-3 sm:max-w-xl">
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
                permission="audit.correct"
                size="sm"
                disabled={correctionRef.trim() === "" || correctionReason.trim() === ""}
                onClick={() => {
                  const ok = recordCorrection({
                    objectRef: correctionRef.trim(),
                    reason: correctionReason.trim(),
                    traceId: correctionTrace,
                  });
                  if (ok) {
                    setCorrectionReason("");
                    toast.success("Correction appended", {
                      description: `Reversal and corrected entry recorded for ${correctionRef.trim()}.`,
                    });
                  }
                }}
              >
                Append correction
              </PermissionButton>
            </div>
          </div>
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
