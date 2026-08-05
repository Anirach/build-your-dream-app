import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, Pencil, Play, RotateCcw, XCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  confidenceBand,
  demoModel,
  mappingRows,
  mappingRun,
  recentRuns,
  sampleSops,
} from "@/demo-data/mapping";
import { standards } from "@/demo-data/standards";
import { useDemoState } from "@/demo-data/store";
import type { MappingRowView } from "@/demo-data/types";

const TITLE = "AI Workbench - BDMS Intelligence";
const DESCRIPTION =
  "Simulate an SOP-to-standards mapping run, review every clause and record human decisions.";

const RUN_STEPS = [
  "Loading synthetic SOP document",
  "Segmenting clauses",
  "Retrieving candidate standards",
  "Scoring matches and validating citations",
  "Assembling draft mapping",
];

type FilterId = "all" | "low" | "nomatch" | "pending";

export const Route = createFileRoute("/workbench/")({
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
  component: WorkbenchPage,
});

function WorkbenchPage() {
  const { clauseDecisions, decideClause, completeReview, auditReference, resetDemo } =
    useDemoState();
  const [sop, setSop] = useState(sampleSops[0]!);
  const [runState, setRunState] = useState<"idle" | "running" | "complete">("complete");
  const [step, setStep] = useState(RUN_STEPS.length);
  const [filter, setFilter] = useState<FilterId>("all");
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const decidedCount = Object.keys(clauseDecisions).length;

  const counts = useMemo(() => {
    const c = { approved: 0, edited: 0, rejected: 0 };
    for (const d of Object.values(clauseDecisions)) {
      if (d.status === "Approved") c.approved += 1;
      else if (d.status === "Edited" || d.status === "Added") c.edited += 1;
      else if (d.status === "Rejected") c.rejected += 1;
    }
    return c;
  }, [clauseDecisions]);

  const rows = useMemo(() => {
    return mappingRows.filter((r) => {
      const decided = Boolean(clauseDecisions[r.id]);
      if (filter === "low") return confidenceBand(r.confidence) === "Low";
      if (filter === "nomatch") return r.standardId === null;
      if (filter === "pending") return !decided;
      return true;
    });
  }, [filter, clauseDecisions]);

  const openRow = openRowId ? (mappingRows.find((r) => r.id === openRowId) ?? null) : null;

  function startRun() {
    setRunState("running");
    setStep(0);
    RUN_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStep(i + 1);
        if (i === RUN_STEPS.length - 1) {
          setRunState("complete");
          toast.success("Simulated mapping run complete", {
            description: `${mappingRun.mapped} of ${mappingRun.clauses} synthetic clauses drafted. Draft only.`,
          });
        }
      }, 450 * (i + 1));
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "AI Workbench" }]}
        title="AI Workbench"
        subtitle="Simulated SOP-to-standards mapping. Every output is a draft until a human reviewer decides."
        secondary={
          <DemoDownloadButton
            filename="mapping-draft-demo.csv"
            label="Export draft mapping"
            content={[
              "clause,standard,measurable_element,confidence,review",
              ...mappingRows.map((r) =>
                [
                  r.clauseNo,
                  r.standardId ?? "no match",
                  r.measurableElement ?? "-",
                  r.confidence.toFixed(2),
                  clauseDecisions[r.id]?.status ?? "Not reviewed",
                ]
                  .map((v) => `"${v}"`)
                  .join(","),
              ),
            ].join("\n")}
          />
        }
        primary={
          <Button onClick={startRun} disabled={runState === "running"}>
            <Play className="size-4" aria-hidden />
            {runState === "running" ? "Running..." : "Run mapping agent"}
          </Button>
        }
      />

      <SectionCard
        title="Run configuration"
        description="Synthetic documents only. No external service is called."
        actions={<DraftBadge />}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Source SOP
            </label>
            <Select value={sop} onValueChange={setSop}>
              <SelectTrigger aria-label="Select synthetic SOP">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sampleSops.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <Bot className="mr-1.5 inline size-3.5" aria-hidden />
              Model {demoModel} · prompt {mappingRun.promptHash}
            </div>
            {runState === "running" ? (
              <div className="space-y-2">
                <Progress value={(step / RUN_STEPS.length) * 100} />
                <p className="text-xs text-muted-foreground">
                  {RUN_STEPS[Math.min(step, RUN_STEPS.length - 1)]}...
                </p>
              </div>
            ) : null}
          </div>
          <KeyValue
            items={[
              { label: "Run reference", value: mappingRun.id },
              { label: "Module", value: mappingRun.moduleCode },
              { label: "Input document", value: mappingRun.inputDocument },
              { label: "Created", value: mappingRun.created },
              { label: "Status", value: <StateBadge state={mappingRun.status} /> },
              { label: "Invalid citations", value: mappingRun.invalidCitations },
            ]}
          />
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Clauses parsed" value={mappingRun.clauses} hint="Synthetic clauses" />
        <MetricCard label="Draft mappings" value={mappingRun.mapped} hint="Awaiting human decision" />
        <MetricCard label="No match" value={mappingRun.noMatch} hint="Reviewer must decide" />
        <MetricCard
          label="Reviewed"
          value={`${decidedCount}/${mappingRows.length}`}
          hint="This session"
        />
      </div>

      <SectionCard title="Draft quality distribution">
        <SegmentedBar
          segments={[
            {
              label: "High confidence",
              value: mappingRows.filter((r) => confidenceBand(r.confidence) === "High").length,
              className: "bg-success",
            },
            {
              label: "Medium",
              value: mappingRows.filter((r) => confidenceBand(r.confidence) === "Medium").length,
              className: "bg-warning",
            },
            {
              label: "Low",
              value: mappingRows.filter((r) => confidenceBand(r.confidence) === "Low").length,
              className: "bg-danger",
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Clause mapping review"
        description="Open a clause to see the rationale, synthetic citation and decision controls."
        actions={
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterId)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="low">Low confidence</TabsTrigger>
              <TabsTrigger value="nomatch">No match</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              tone="success"
              title="Nothing left in this filter"
              description="Every clause in this view has a recorded human decision."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Clause (synthetic)</TableHead>
                  <TableHead className="w-44">Proposed standard</TableHead>
                  <TableHead className="w-48">Confidence</TableHead>
                  <TableHead className="w-40">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const decision = clauseDecisions[row.id];
                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setOpenRowId(row.id)}
                    >
                      <TableCell className="tnum font-semibold text-navy">{row.clauseNo}</TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{row.clausePreview}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{row.sourceRef}</p>
                      </TableCell>
                      <TableCell>
                        {row.standardId ? (
                          <div className="space-y-1">
                            <CitationChip reference={row.measurableElement ?? row.standardId} />
                          </div>
                        ) : (
                          <Badge variant="outline">No match</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ConfidenceIndicator value={row.confidence} />
                      </TableCell>
                      <TableCell>
                        <StateBadge state={decision?.status ?? "Not reviewed"} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Complete review"
        description="Recording a decision set appends a simulated audit reference."
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {counts.approved} approved · {counts.edited} edited · {counts.rejected} rejected ·{" "}
            {mappingRows.length - decidedCount} pending
          </p>
          <Button
            disabled={decidedCount === 0}
            onClick={() => {
              const ref = completeReview({ ...counts });
              toast.success("Review recorded", { description: `Audit reference ${ref}` });
            }}
          >
            <CheckCircle2 className="size-4" aria-hidden /> Complete review
          </Button>
          <Button variant="outline" onClick={resetDemo}>
            <RotateCcw className="size-4" aria-hidden /> Reset demo state
          </Button>
          {auditReference ? <Badge variant="secondary">{auditReference}</Badge> : null}
        </div>
      </SectionCard>

      <SectionCard title="Recent runs" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>SOP</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Clauses</TableHead>
                <TableHead>Mapped</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="tnum font-semibold text-navy">{run.id}</TableCell>
                  <TableCell className="max-w-xs text-sm">{run.sop}</TableCell>
                  <TableCell>{run.moduleCode}</TableCell>
                  <TableCell className="tnum">{run.clauses}</TableCell>
                  <TableCell className="tnum">{run.mapped}</TableCell>
                  <TableCell>
                    <StateBadge state={run.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <NoticeBanner tone="warning">
        Synthetic placeholder content. AI drafts in this mockup cannot approve, publish or change
        programme status.
      </NoticeBanner>

      <ClauseSheet row={openRow} onClose={() => setOpenRowId(null)} onDecide={decideClause} />
    </>
  );
}

function ClauseSheet({
  row,
  onClose,
  onDecide,
}: {
  row: MappingRowView | null;
  onClose: () => void;
  onDecide: ReturnType<typeof useDemoState>["decideClause"];
}) {
  const [standardId, setStandardId] = useState<string>("");
  const [reason, setReason] = useState("");

  const current = row?.standardId ?? "";
  const selected = standardId || current;

  function record(status: MappingRowView["reviewStatus"]) {
    if (!row) return;
    if (status === "Rejected" && reason.trim() === "") {
      toast.error("A rejection reason is required");
      return;
    }
    onDecide(row, {
      status,
      standardId: status === "Rejected" ? null : selected || null,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
    toast.success(`Clause ${row.clauseNo} ${status.toLowerCase()}`);
    setReason("");
    setStandardId("");
    onClose();
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader>
              <SheetTitle>Clause {row.clauseNo} decision</SheetTitle>
              <SheetDescription>{row.sourceRef} · synthetic source reference</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                {row.clauseFull}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ConfidenceIndicator value={row.confidence} />
                {row.standardId ? (
                  <CitationChip reference={row.measurableElement ?? row.standardId} />
                ) : (
                  <Badge variant="outline">No match proposed</Badge>
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Why the agent proposed this
                </h3>
                <p className="mt-1 text-sm">{row.rationale}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.keyPhrases.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Mapped standard
                </label>
                <Select value={selected} onValueChange={setStandardId}>
                  <SelectTrigger aria-label="Choose mapped standard">
                    <SelectValue placeholder="Select a standard" />
                  </SelectTrigger>
                  <SelectContent>
                    {standards.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.id} - {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Reviewer reason
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Required when rejecting. Recorded in the demo audit trail."
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => record("Approved")}>
                  <CheckCircle2 className="size-4" aria-hidden /> Approve
                </Button>
                <Button variant="secondary" onClick={() => record("Edited")}>
                  <Pencil className="size-4" aria-hidden /> Save edit
                </Button>
                <Button variant="outline" onClick={() => record("Rejected")}>
                  <XCircle className="size-4" aria-hidden /> Reject
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
