import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import {
  DemoDownloadButton,
  EmptyState,
  MetricCard,
  NoticeBanner,
  SectionCard,
} from "@/components/app/primitives";
import { RagBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CAUSE_LABELS,
  ESTATES,
  LABEL_DISCLAIMER,
  modules,
  programmeSummary,
  STAGES,
} from "@/demo-data/modules";
import { personName } from "@/demo-data/people";
import type { Rag } from "@/demo-data/types";

export const Route = createFileRoute("/programme/")({
  head: () => ({
    meta: [
      { title: "Programme Modules - BDMS Intelligence Mockup" },
      {
        name: "description",
        content:
          "Filter and compare all 31 synthetic commissioning modules by RAG status, estate, stage and owner.",
      },
      { property: "og:title", content: "Programme Modules - BDMS Intelligence Mockup" },
      {
        property: "og:description",
        content: "Module registry with rule-based RAG status, variance and evidence gap counts.",
      },
    ],
  }),
  component: ProgrammeIndex,
});

type SortKey = "code" | "rag" | "variance" | "gaps";

const ragOrder: Record<Rag, number> = { red: 0, amber: 1, green: 2 };

function ProgrammeIndex() {
  const [query, setQuery] = useState("");
  const [rag, setRag] = useState<"all" | Rag>("all");
  const [estate, setEstate] = useState("all");
  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState<SortKey>("rag");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = modules.filter((m) => {
      if (rag !== "all" && m.rag !== rag) return false;
      if (estate !== "all" && m.estate !== estate) return false;
      if (stage !== "all" && m.stage !== stage) return false;
      if (q && !`${m.code} ${m.label}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "code") return a.code.localeCompare(b.code);
      if (sort === "variance") return b.baselineVarianceDays - a.baselineVarianceDays;
      if (sort === "gaps") return b.evidenceGaps - a.evidenceGaps;
      return ragOrder[a.rag] - ragOrder[b.rag] || b.baselineVarianceDays - a.baselineVarianceDays;
    });
  }, [query, rag, estate, stage, sort]);

  const activeFilters = [rag !== "all", estate !== "all", stage !== "all", query !== ""].filter(
    Boolean,
  ).length;

  function clearAll() {
    setQuery("");
    setRag("all");
    setEstate("all");
    setStage("all");
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Programme" }]}
        title="Programme modules"
        subtitle="All 31 commissioning modules with rule-calculated status. Labels are placeholders pending the official registry."
        secondary={
          <DemoDownloadButton
            filename="bdms-modules-demo.csv"
            label="Export filtered"
            content={`code,label,rag,progress,variance_days,evidence_gaps\n${filtered
              .map(
                (m) =>
                  `${m.code},"${m.label}",${m.rag},${m.progress},${m.baselineVarianceDays},${m.evidenceGaps}`,
              )
              .join("\n")}`}
          />
        }
        primary={
          <Button asChild size="sm">
            <Link to="/programme/modules/$moduleId" params={{ moduleId: "M03" }}>
              Open showcase module
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Red modules"
          value={programmeSummary.redModules}
          hint="Filter the table to red modules"
          active={rag === "red"}
          onClick={() => setRag(rag === "red" ? "all" : "red")}
        />
        <MetricCard
          label="Amber modules"
          value={programmeSummary.amberModules}
          hint="Filter the table to amber modules"
          active={rag === "amber"}
          onClick={() => setRag(rag === "amber" ? "all" : "amber")}
        />
        <MetricCard
          label="Green modules"
          value={programmeSummary.greenModules}
          hint="Filter the table to green modules"
          active={rag === "green"}
          onClick={() => setRag(rag === "green" ? "all" : "green")}
        />
        <MetricCard
          label="Overdue packages"
          value={programmeSummary.overduePackages}
          hint="Across all modules (synthetic)"
        />
      </div>

      <SectionCard
        className="mt-5"
        title={`Module registry (${filtered.length} of ${modules.length})`}
        description={LABEL_DISCLAIMER}
        bodyClassName="px-0 pt-0 pb-0"
        actions={
          <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <TabsList>
              <TabsTrigger value="rag">Status</TabsTrigger>
              <TabsTrigger value="variance">Variance</TabsTrigger>
              <TabsTrigger value="gaps">Gaps</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search module code or label"
              aria-label="Search modules"
              className="pl-9"
            />
          </div>
          <Select value={estate} onValueChange={setEstate}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by estate">
              <SelectValue placeholder="Estate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All estates</SelectItem>
              {ESTATES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-[210px]" aria-label="Filter by stage">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-4" aria-hidden /> Clear {activeFilters}
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No modules match these filters"
              description="Adjust or clear the filters to see the synthetic module registry again."
              action={
                <Button variant="outline" size="sm" onClick={clearAll}>
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
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]">Progress</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Gaps</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Causes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.code}>
                    <TableCell className="max-w-[260px]">
                      <span className="tnum font-semibold text-navy">{m.code}</span>
                      <span className="block text-xs text-muted-foreground">{m.label}</span>
                    </TableCell>
                    <TableCell>
                      <RagBadge rag={m.rag} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={m.progress} className="h-2" />
                        <span className="tnum text-xs font-semibold">{m.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.stage}</TableCell>
                    <TableCell className="tnum text-right">
                      {m.baselineVarianceDays > 0 ? `+${m.baselineVarianceDays}` : m.baselineVarianceDays}d
                    </TableCell>
                    <TableCell className="tnum text-right">{m.overduePackages}</TableCell>
                    <TableCell className="tnum text-right">{m.evidenceGaps}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {personName(m.ownerId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.causes.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          m.causes.map((c) => (
                            <span
                              key={c}
                              className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px]"
                            >
                              {CAUSE_LABELS[c]}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/programme/modules/$moduleId" params={{ moduleId: m.code }}>
                          Open <ArrowUpRight className="size-3.5" aria-hidden />
                        </Link>
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
        Detailed drill-down data is only populated for module M03 in this mockup. Other modules show
        registry-level synthetic values.
      </NoticeBanner>
    </>
  );
}