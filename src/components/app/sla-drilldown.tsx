// Click-through drill-down for SLA analytics. Given a set of SLA hand-off
// records (a chart datapoint, a stage card or a breakdown row), show the exact
// corrections behind it and, for hand-offs recorded in this session, their full
// stage timeline. Concept-only: synthetic history has no live timeline.
import { Link } from "@tanstack/react-router";
import { Check, Clock, ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/app/status";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildTimeline, formatDuration } from "@/demo-data/correction-timeline";
import type { CorrectionRequest } from "@/demo-data/corrections";
import { roleName } from "@/demo-data/permissions";
import { formatHours, type SlaRecord } from "@/demo-data/sla-analytics";
import { cn } from "@/lib/utils";

export interface SlaDrillDown {
  title: string;
  description: string;
  records: SlaRecord[];
}

function TimelineList({ request, nowMs }: { request: CorrectionRequest; nowMs: number }) {
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

export function SlaDrillDownSheet({
  drill,
  requests,
  nowMs,
  onClose,
}: {
  drill: SlaDrillDown | null;
  requests: CorrectionRequest[];
  nowMs: number;
  onClose: () => void;
}) {
  const records = drill ? [...drill.records].sort((a, b) => b.hours - a.hours) : [];
  const breaches = records.filter((r) => r.hours > r.targetHours).length;

  return (
    <Sheet open={Boolean(drill)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {drill && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>{drill.title}</SheetTitle>
              <SheetDescription>{drill.description}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={`${records.length} hand-offs`} tone="neutral" />
              <StatusBadge
                label={`${breaches} past target`}
                tone={breaches === 0 ? "success" : "danger"}
              />
            </div>

            <ul className="space-y-3">
              {records.map((rec) => {
                const request = requests.find((r) => r.id === rec.requestId);
                const breached = rec.hours > rec.targetHours;
                return (
                  <li key={rec.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="tnum text-sm font-semibold text-navy">{rec.requestId}</p>
                      <StatusBadge
                        label={`${formatHours(rec.hours)} / ${Math.round(rec.targetHours * 10) / 10}h target`}
                        tone={breached ? "danger" : "success"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rec.mandateType} · {rec.stage === "Sign-off" ? "Reviewer sign-off" : "Applied by reversal"} ·{" "}
                      {roleName(rec.role)} · {rec.week} ·{" "}
                      {rec.live ? "recorded this session" : "synthetic history"}
                    </p>

                    {request ? (
                      <>
                        <p className="mt-2 text-xs text-navy">
                          {request.targetRef} · {request.reason}
                        </p>
                        <TimelineList request={request} nowMs={nowMs} />
                        <Link
                          to="/audit"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          Open in Audit and Lineage
                          <ExternalLink className="size-3.5" aria-hidden />
                        </Link>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Stage timeline is not available for synthetic history records — raise a
                        correction on Audit and Lineage to see a live timeline here.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
