import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Info } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import {
  DemoDownloadButton,
  MetricCard,
  NoticeBanner,
  SectionCard,
  SegmentedBar,
} from "@/components/app/primitives";
import { RagBadge, RuleResultBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
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
import {
  CAUSE_LABELS,
  decisions,
  LABEL_DISCLAIMER,
  milestones,
  moduleByCode,
  priorityModules,
  programmeStatusDrivers,
  programmeSummary,
  progressSeries,
} from "@/demo-data/modules";
import { personName } from "@/demo-data/people";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Overview - BDMS Intelligence Mockup" },
      {
        name: "description",
        content:
          "Programme-level commissioning readiness across 30 synthetic modules, with rule-based RAG explanations and overdue decisions.",
      },
      { property: "og:title", content: "Executive Overview - BDMS Intelligence Mockup" },
      {
        property: "og:description",
        content:
          "Programme-level commissioning readiness across 30 synthetic modules, with rule-based RAG explanations and overdue decisions.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const [driversOpen, setDriversOpen] = useState(false);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka" }, { label: "Executive Overview" }]}
        title="Executive Overview"
        subtitle="Programme readiness across 30 commissioning modules, calculated from synthetic rules rather than manual judgement."
        refreshed={programmeSummary.lastRefreshed}
        secondary={
          <DemoDownloadButton
            filename="bdms-programme-overview-demo.csv"
            label="Export summary"
            content={`module,rag,progress\n${priorityModules
              .map((c) => `${c},${moduleByCode(c)?.rag},${moduleByCode(c)?.progress}`)
              .join("\n")}`}
          />
        }
        primary={
          <Button asChild size="sm">
            <Link to="/programme">Open programme view</Link>
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Programme status"
          description={programmeSummary.explanation}
          actions={
            <Button variant="outline" size="sm" onClick={() => setDriversOpen(true)}>
              <Info className="size-4" aria-hidden /> Why this status
            </Button>
          }
        >
          <div className="flex flex-wrap items-center gap-4">
            <RagBadge rag={programmeSummary.rag} size="lg" />
            <div className="text-sm text-muted-foreground">
              <p>
                Baseline <span className="font-semibold text-navy">{programmeSummary.baseline}</span>
              </p>
              <p className="mt-0.5">
                Next milestone:{" "}
                <span className="font-semibold text-navy">{programmeSummary.nextMilestone}</span>
              </p>
            </div>
          </div>
          <SegmentedBar
            className="mt-6"
            segments={[
              { label: "Green", value: programmeSummary.greenModules, className: "bg-success" },
              { label: "Amber", value: programmeSummary.amberModules, className: "bg-warning" },
              { label: "Red", value: programmeSummary.redModules, className: "bg-danger" },
            ]}
          />
          <p className="mt-4 text-xs text-muted-foreground">{LABEL_DISCLAIMER}</p>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            label="Modules requiring intervention"
            value={programmeSummary.redModules}
            hint="Modules breaching at least one red rule"
            trend={{ direction: "up", text: "Up 1 since last refresh" }}
          />
          <MetricCard
            label="Overdue work packages"
            value={programmeSummary.overduePackages}
            hint="Past baseline finish date across all modules"
            trend={{ direction: "up", text: "Concentrated in 4 modules" }}
          />
          <MetricCard
            label="Decisions awaiting owners"
            value={programmeSummary.decisionsAwaiting}
            hint="Owner decisions with no recorded outcome"
            trend={{ direction: "flat", text: "3 older than 10 days" }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Priority modules"
          description="Ranked by rule breaches, then baseline variance."
          bodyClassName="px-0 py-0"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Primary cause</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityModules.map((code) => {
                  const module = moduleByCode(code);
                  if (!module) return null;
                  const cause = module.causes[0];
                  return (
                    <TableRow key={code}>
                      <TableCell className="font-medium text-navy">
                        <span className="tnum">{module.code}</span> {module.label}
                      </TableCell>
                      <TableCell>
                        <RagBadge rag={module.rag} />
                      </TableCell>
                      <TableCell className="tnum text-right">
                        {module.baselineVarianceDays > 0
                          ? `+${module.baselineVarianceDays}d`
                          : `${module.baselineVarianceDays}d`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cause ? CAUSE_LABELS[cause] : "No open breach"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {personName(module.ownerId)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/programme/modules/$moduleId" params={{ moduleId: module.code }}>
                            Open <ArrowUpRight className="size-3.5" aria-hidden />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <SectionCard title="Decisions awaiting action" description="Oldest first.">
          <ul className="space-y-3">
            {decisions.slice(0, 5).map((d) => (
              <li key={d.id} className="rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-navy">{d.title}</p>
                  <span className="tnum shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold">
                    {d.ageDays}d
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.owner} · due {d.due} ·{" "}
                  <Link
                    to="/programme/modules/$moduleId"
                    params={{ moduleId: d.moduleCode }}
                    className="text-primary hover:underline"
                  >
                    {d.moduleCode}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Readiness trend"
          description="Weighted completion against the frozen BL0 baseline."
        >
          <TrendChart />
        </SectionCard>

        <SectionCard title="Milestones against BL0" bodyClassName="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-navy">{m.label}</TableCell>
                  <TableCell className="tnum text-muted-foreground">{m.baseline}</TableCell>
                  <TableCell className="tnum">{m.forecast}</TableCell>
                  <TableCell>
                    <RagBadge
                      rag={m.state === "On track" ? "green" : m.state === "Watch" ? "amber" : "red"}
                      label={m.state}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </div>

      <NoticeBanner tone="info" icon={<Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />}>
        <p className="mt-0 mb-0">
          Every figure on this page is synthetic. RAG values are produced by demo rules and cannot be
          overridden by hand — see{" "}
          <button className="font-medium text-primary underline" onClick={() => setDriversOpen(true)}>
            the rule breakdown
          </button>
          .
        </p>
      </NoticeBanner>

      <Sheet open={driversOpen} onOpenChange={setDriversOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Why the programme is amber</SheetTitle>
            <SheetDescription>
              Five demo rules evaluate every refresh. Amber is the highest severity currently reached.
            </SheetDescription>
          </SheetHeader>
          <ul className="space-y-4 px-4 pb-8">
            {programmeStatusDrivers.map((driver) => (
              <li key={driver.rule} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-navy">{driver.rule}</p>
                  <RuleResultBadge result={driver.result} />
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted-foreground">Value</dt>
                    <dd className="tnum font-medium">{driver.value}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted-foreground">Threshold</dt>
                    <dd className="tnum">{driver.threshold}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted-foreground">Source</dt>
                    <dd>{driver.source}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm text-muted-foreground">{driver.detail}</p>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TrendChart() {
  const width = 560;
  const height = 200;
  const max = 100;
  const points = progressSeries.map((p, i) => {
    const x = (i / Math.max(progressSeries.length - 1, 1)) * width;
    const y = height - (p.actual / max) * height;
    return `${x},${y}`;
  });
  const baselinePoints = progressSeries.map((p, i) => {
    const x = (i / Math.max(progressSeries.length - 1, 1)) * width;
    const y = height - (p.planned / max) * height;
    return `${x},${y}`;
  });

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full"
        role="img"
        aria-label="Weighted completion trend against baseline, synthetic data"
      >
        <polyline
          points={baselinePoints.join(" ")}
          fill="none"
          stroke="oklch(0.72 0.02 250)"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-primary" aria-hidden /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-muted-foreground" aria-hidden />{" "}
          Baseline BL0
        </span>
        <span>
          {progressSeries[0]?.week} to {progressSeries[progressSeries.length - 1]?.week}
        </span>
      </figcaption>
    </figure>
  );
}