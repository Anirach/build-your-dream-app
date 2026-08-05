import { createFileRoute, Link } from "@tanstack/react-router";
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
  SegmentedBar,
} from "@/components/app/primitives";
import { ConfidenceIndicator, DraftBadge, StateBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { gapAnalyses } from "@/demo-data/gaps";
import { useDemoState } from "@/demo-data/store";
import type { GapMatrixRowView } from "@/demo-data/types";

const TITLE = "Gap analysis - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Synthetic gap matrices comparing commissioning evidence against placeholder standards, with reviewer approve and return actions.";

export const Route = createFileRoute("/gap-analysis/")({
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

const STATE_FILTERS = ["All", "Absent", "Partial", "Present - unverified", "Present"] as const;

function Page() {
  const { gapRowStatus, setGapRowStatus } = useDemoState();
  const [analysisId, setAnalysisId] = useState(gapAnalyses[0]!.id);
  const [stateFilter, setStateFilter] = useState<(typeof STATE_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [openRow, setOpenRow] = useState<GapMatrixRowView | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const analysis = gapAnalyses.find((g) => g.id === analysisId)!;

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      analysis.rows.filter(
        (r) =>
          (stateFilter === "All" || r.state === stateFilter) &&
          (q === "" ||
            r.summary.toLowerCase().includes(q) ||
            r.requirementId.toLowerCase().includes(q) ||
            r.proposedOwner.toLowerCase().includes(q)),
      ),
    [analysis, stateFilter, q],
  );

  const outstanding = analysis.rows.filter(
    (r) => (gapRowStatus[r.id] ?? r.reviewStatus) === "Not reviewed",
  ).length;

  const csv = [
    "row,requirement,summary,state,confidence,module,owner,review status,next action",
    ...rows.map((r) =>
      [
        r.id,
        r.requirementId,
        `"${r.summary}"`,
        r.state,
        r.confidence.toFixed(2),
        r.proposedModule,
        `"${r.proposedOwner}"`,
        gapRowStatus[r.id] ?? r.reviewStatus,
        `"${r.nextAction}"`,
      ].join(","),
    ),
  ].join("\n");

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Gap analysis" }]}
        title="Gap analysis"
        subtitle="Draft evidence-gap matrices generated from synthetic documents. Every row needs a human decision before it can drive programme action."
        secondary={
          <DemoDownloadButton
            filename={`synthetic-${analysis.id}-gap-matrix.csv`}
            content={csv}
            label="Export matrix"
          />
        }
        primary={
          <Button asChild size="sm">
            <Link to="/reviews">Open review queue</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {gapAnalyses.map((g) => (
          <Button
            key={g.id}
            size="sm"
            variant={g.id === analysisId ? "default" : "outline"}
            onClick={() => {
              setAnalysisId(g.id);
              setStateFilter("All");
            }}
          >
            {g.name} <span className="ml-1 opacity-70">{g.version}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Requirements assessed" value={analysis.rows.length} hint="Synthetic requirement rows in this matrix" />
        <MetricCard
          label="Absent evidence"
          value={analysis.absent}
          hint="Rows with no supporting synthetic evidence"
          onClick={() => setStateFilter("Absent")}
          active={stateFilter === "Absent"}
        />
        <MetricCard
          label="Partial or unverified"
          value={analysis.partial + analysis.unverified}
          hint="Rows needing additional or verifiable evidence"
          onClick={() => setStateFilter("Partial")}
          active={stateFilter === "Partial"}
        />
        <MetricCard
          label="Awaiting reviewer"
          value={outstanding}
          hint="Rows not yet approved or returned in this session"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Evidence coverage" className="lg:col-span-2">
          <SegmentedBar
            segments={[
              { label: "Present", value: analysis.present, className: "bg-success" },
              { label: "Partial", value: analysis.partial, className: "bg-warning" },
              { label: "Unverified", value: analysis.unverified, className: "bg-info" },
              { label: "Absent", value: analysis.absent, className: "bg-danger" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Run provenance" actions={<DraftBadge />}>
          <KeyValue
            items={[
              { label: "Run ID", value: <span className="tnum font-mono text-xs">{analysis.runId}</span> },
              { label: "Module", value: analysis.moduleCode },
              { label: "Model", value: analysis.model },
              { label: "Prompt hash", value: <span className="tnum font-mono text-xs">{analysis.promptHash}</span> },
              { label: "Documents assessed", value: analysis.documentsAssessed },
              { label: "Last run", value: analysis.lastRun },
              { label: "Owner review", value: analysis.ownerReviewState },
              { label: "Scope", value: analysis.scope },
            ]}
          />
        </SectionCard>
      </div>

      <div className="mt-6 space-y-6">
        <SectionCard
          title="Gap matrix"
          description="Select a row to see why it was assigned, what evidence is missing, and to record a decision."
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requirement, summary or owner"
              className="h-9 w-full sm:w-72"
              aria-label="Search gap matrix"
            />
          }
          bodyClassName="px-0 py-0"
        >
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
            {STATE_FILTERS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={stateFilter === s ? "default" : "outline"}
                onClick={() => setStateFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No matching rows"
                description="No synthetic requirement rows match this state filter and search."
                action={
                  <Button variant="outline" size="sm" onClick={() => { setStateFilter("All"); setQuery(""); }}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Current evidence</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Proposed owner</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="align-top">
                        <Link
                          to="/standards/$standardId"
                          params={{ standardId: r.requirementId }}
                          className="tnum font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          {r.requirementId}
                        </Link>
                        <p className="mt-1 max-w-xs text-sm font-medium text-navy">{r.summary}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="max-w-sm text-sm text-muted-foreground">{r.currentEvidence}</p>
                        {r.citation !== "-" && (
                          <span className="mt-1.5 inline-block">
                            <CitationChip reference={r.citation} />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <StateBadge state={r.state} />
                      </TableCell>
                      <TableCell className="align-top">
                        <ConfidenceIndicator value={r.confidence} />
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="text-sm text-foreground">{r.proposedOwner}</p>
                        <p className="text-xs text-muted-foreground">Module {r.proposedModule}</p>
                      </TableCell>
                      <TableCell className="align-top">
                        <StateBadge state={gapRowStatus[r.id] ?? r.reviewStatus} />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setOpenRow(r);
                            setReturnReason("");
                          }}
                        >
                          Review row
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        <NoticeBanner tone="warning">
          Synthetic gap matrices for concept demonstration only. Findings, owners and citations are
          fictional and carry no clinical or contractual authority.
        </NoticeBanner>
      </div>

      <Sheet open={openRow !== null} onOpenChange={(open) => !open && setOpenRow(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {openRow && (
            <>
              <SheetHeader>
                <SheetTitle className="text-navy">{openRow.summary}</SheetTitle>
                <SheetDescription>
                  {openRow.id} · {openRow.requirementId} · draft finding from run {analysis.runId}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <StateBadge state={openRow.state} />
                  <ConfidenceIndicator value={openRow.confidence} />
                  <DraftBadge />
                </div>

                <KeyValue
                  items={[
                    { label: "Current evidence", value: openRow.currentEvidence },
                    {
                      label: "Citation",
                      value:
                        openRow.citation === "-" ? (
                          <span className="text-muted-foreground">None supplied</span>
                        ) : (
                          <CitationChip reference={openRow.citation} />
                        ),
                    },
                    { label: "Proposed module", value: openRow.proposedModule },
                    { label: "Proposed owner", value: openRow.proposedOwner },
                  ]}
                />

                <div>
                  <h3 className="text-sm font-semibold text-navy">Why this was assigned</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{openRow.whyAssigned}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy">Missing evidence</h3>
                  {openRow.missingEvidence.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nothing outstanding in the synthetic input set.
                    </p>
                  ) : (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {openRow.missingEvidence.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy">Input documents</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {openRow.inputDocuments.map((d) => (
                      <CitationChip key={d} reference={d} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy">Proposed next action</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{openRow.nextAction}</p>
                </div>

                <div>
                  <label htmlFor="gap-return-reason" className="text-sm font-semibold text-navy">
                    Reason (required to return)
                  </label>
                  <Textarea
                    id="gap-return-reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Explain what the agent must correct before re-running."
                    className="mt-1.5"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setGapRowStatus(openRow.id, "Approved", returnReason || undefined);
                      toast.success("Row approved", {
                        description: `${openRow.id} recorded in the session audit trail.`,
                      });
                      setOpenRow(null);
                    }}
                  >
                    Approve row
                  </Button>
                  <Button
                    variant="outline"
                    disabled={returnReason.trim() === ""}
                    onClick={() => {
                      setGapRowStatus(openRow.id, "Returned", returnReason.trim());
                      toast.success("Row returned for correction", {
                        description: `${openRow.id} returned with a recorded reason.`,
                      });
                      setOpenRow(null);
                    }}
                  >
                    Return with reason
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
