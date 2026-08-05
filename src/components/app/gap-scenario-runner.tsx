import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Trash2 } from "lucide-react";

import {
  DemoDownloadButton,
  EmptyState,
  NoticeBanner,
  SectionCard,
  SegmentedBar,
} from "@/components/app/primitives";
import { DraftBadge, StateBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoState } from "@/demo-data/store";
import {
  defaultLevers,
  leverSummary,
  projectMatrix,
  type ScenarioLevers,
} from "@/demo-data/scenarios";
import type { GapAnalysisSummary } from "@/demo-data/types";

const STRICTNESS: ScenarioLevers["strictness"][] = ["Lenient", "Standard", "Strict"];

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  const bad = invert ? value > 0 : value < 0;
  const tone = value === 0 ? "neutral" : good ? "success" : bad ? "danger" : "neutral";
  return (
    <span
      className={
        "tnum text-xs font-semibold " +
        (tone === "success"
          ? "text-success"
          : tone === "danger"
            ? "text-danger"
            : "text-muted-foreground")
      }
    >
      {value > 0 ? "+" : value < 0 ? "" : "±"}
      {value === 0 ? 0 : value}
    </span>
  );
}

export function GapScenarioRunner({ analysis }: { analysis: GapAnalysisSummary }) {
  const { gapScenarios, saveScenario, deleteScenario, selectedScenarioId, selectScenario } =
    useDemoState();
  const [levers, setLevers] = useState<ScenarioLevers>(defaultLevers);
  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const baseline = useMemo(() => projectMatrix(analysis, defaultLevers), [analysis]);
  const projection = useMemo(() => projectMatrix(analysis, levers), [analysis, levers]);

  const scenarios = gapScenarios.filter((s) => s.matrixId === analysis.id);
  const changedRows = projection.rows.filter((r) => r.from !== r.to);

  const best = scenarios.reduce<(typeof scenarios)[number] | null>(
    (acc, s) => (acc === null || s.coverage > acc.coverage ? s : acc),
    null,
  );

  function update<K extends keyof ScenarioLevers>(key: K, value: ScenarioLevers[K]) {
    setLevers((prev) => ({ ...prev, [key]: value }));
  }

  function run() {
    if (running) return;
    setRunning(true);
    setProgress(8);
    const steps = [26, 48, 71, 90, 100];
    steps.forEach((p, i) => {
      window.setTimeout(() => {
        setProgress(p);
        if (p === 100) {
          const saved = saveScenario({
            matrixId: analysis.id,
            matrixName: analysis.name,
            name: name.trim() || `Scenario ${scenarios.length + 1}`,
            levers,
            counts: projection.counts,
            coverage: projection.coverage,
            blockers: projection.blockers,
            effort: projection.effort,
            note: `${changedRows.length} of ${projection.counts.total} rows change state under these assumptions.`,
          });
          setRunning(false);
          setProgress(0);
          setName("");
          toast.success("Scenario saved", {
            description: `${saved.name} · coverage ${saved.coverage}% · run ${saved.runId}`,
          });
        }
      }, 220 * (i + 1));
    });
  }

  const csv = [
    "scenario,run id,levers,coverage %,present,unverified,partial,absent,blockers,effort days,created",
    ...scenarios.map((s) =>
      [
        `"${s.name}"`,
        s.runId,
        `"${leverSummary(s.levers)}"`,
        s.coverage.toFixed(1),
        s.counts.present,
        s.counts.unverified,
        s.counts.partial,
        s.counts.absent,
        s.blockers,
        s.effort,
        `"${s.createdAt}"`,
      ].join(","),
    ),
  ].join("\n");

  return (
    <SectionCard
      title="Scenario runner"
      description="Adjust synthetic assumptions, save each run, and compare coverage deltas against the current matrix before picking a preferred version."
      actions={
        <div className="flex items-center gap-2">
          <DraftBadge />
          {scenarios.length > 0 && (
            <DemoDownloadButton
              filename={`synthetic-${analysis.id}-scenarios.csv`}
              content={csv}
              label="Export scenarios"
            />
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-navy">Evidence acceptance strictness</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STRICTNESS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={levers.strictness === s ? "default" : "outline"}
                  onClick={() => update("strictness", s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="scn-docs" className="text-sm font-semibold text-navy">
              Additional evidence documents assumed
              <span className="tnum ml-2 font-mono text-xs text-muted-foreground">
                {levers.extraDocuments}
              </span>
            </label>
            <input
              id="scn-docs"
              type="range"
              min={0}
              max={4}
              step={1}
              value={levers.extraDocuments}
              onChange={(e) => update("extraDocuments", Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">Owner attestation walk-through</p>
                <p className="text-xs text-muted-foreground">
                  Verifies rows currently marked present but unverified.
                </p>
              </div>
              <Switch
                checked={levers.ownerAttestation}
                onCheckedChange={(v) => update("ownerAttestation", v)}
                aria-label="Owner attestation walk-through"
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">Two-week re-sample</p>
                <p className="text-xs text-muted-foreground">
                  Closes higher-confidence partial rows with fresh sampling.
                </p>
              </div>
              <Switch
                checked={levers.resample}
                onCheckedChange={(v) => update("resample", v)}
                aria-label="Two-week re-sample"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <label htmlFor="scn-name" className="text-sm font-semibold text-navy">
              Scenario name
            </label>
            <Input
              id="scn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Scenario ${scenarios.length + 1}`}
              className="h-9"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={run} disabled={running}>
                {running ? "Running simulation…" : "Run and save scenario"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLevers(defaultLevers)}
                disabled={running}
              >
                Reset assumptions
              </Button>
            </div>
            {running && (
              <div className="pt-2">
                <Progress value={progress} className="h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground tnum">
                  Re-projecting {projection.counts.total} requirement rows · {progress}%
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Projected coverage
                </p>
                <p className="tnum text-3xl font-semibold text-navy">{projection.coverage}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Current matrix {baseline.coverage}%
                </p>
                <p className="tnum text-sm font-semibold">
                  <Delta value={Math.round((projection.coverage - baseline.coverage) * 10) / 10} />{" "}
                  <span className="font-normal text-muted-foreground">points</span>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <SegmentedBar
                segments={[
                  { label: "Present", value: projection.counts.present, className: "bg-success" },
                  { label: "Partial", value: projection.counts.partial, className: "bg-warning" },
                  {
                    label: "Unverified",
                    value: projection.counts.unverified,
                    className: "bg-info",
                  },
                  { label: "Absent", value: projection.counts.absent, className: "bg-danger" },
                ]}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {leverSummary(levers)} · {projection.blockers} blocking rows · estimated{" "}
              {projection.effort} effort days
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-navy">
              Row movements under these assumptions
            </p>
            {changedRows.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No rows change state. Adjust an assumption to model an improvement.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {changedRows.slice(0, 6).map((r) => (
                  <li key={r.row.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="tnum font-mono text-xs text-muted-foreground">
                      {r.row.requirementId}
                    </span>
                    <StateBadge state={r.from} />
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                    <StateBadge state={r.to} />
                  </li>
                ))}
                {changedRows.length > 6 && (
                  <li className="text-xs text-muted-foreground">
                    +{changedRows.length - 6} further rows change state.
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-navy">Saved scenario runs</p>
          {best && (
            <p className="text-xs text-muted-foreground">
              Highest projected coverage: <span className="font-semibold">{best.name}</span> at{" "}
              {best.coverage}%
            </p>
          )}
        </div>

        {scenarios.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No saved scenarios yet"
              description="Run the simulation to store a version of this matrix and compare its coverage delta."
            />
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Assumptions</TableHead>
                  <TableHead className="text-right">Coverage</TableHead>
                  <TableHead className="text-right">Δ vs current</TableHead>
                  <TableHead className="text-right">Blockers</TableHead>
                  <TableHead className="text-right">Effort</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((s) => {
                  const selected = s.id === selectedScenarioId;
                  return (
                    <TableRow key={s.id} className={selected ? "bg-primary/5" : undefined}>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-navy">{s.name}</span>
                          {selected && <StatusBadge label="Preferred" tone="success" />}
                          {best?.id === s.id && !selected && (
                            <StatusBadge label="Best coverage" tone="info" />
                          )}
                        </div>
                        <p className="tnum mt-1 font-mono text-xs text-muted-foreground">
                          {s.runId} · {s.createdAt}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="max-w-xs text-sm text-muted-foreground">
                          {leverSummary(s.levers)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
                      </TableCell>
                      <TableCell className="tnum align-top text-right text-sm font-semibold">
                        {s.coverage}%
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Delta value={Math.round((s.coverage - baseline.coverage) * 10) / 10} />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <span className="tnum text-sm">{s.blockers}</span>{" "}
                        <Delta value={s.blockers - baseline.blockers} invert />
                      </TableCell>
                      <TableCell className="tnum align-top text-right text-sm">
                        {s.effort}d
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant={selected ? "secondary" : "outline"}
                            onClick={() => selectScenario(s.id)}
                            disabled={selected}
                          >
                            <Check className="size-3.5" aria-hidden />
                            {selected ? "Selected" : "Pick this version"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Delete scenario ${s.name}`}
                            onClick={() => {
                              deleteScenario(s.id);
                              toast.success("Scenario discarded", { description: s.runId });
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4">
          <NoticeBanner tone="info">
            Scenario projections are deterministic synthetic estimates for concept demonstration.
            Saving a run and picking a preferred version both append entries to the session audit
            trail; nothing overwrites the source matrix.
          </NoticeBanner>
        </div>
      </div>
    </SectionCard>
  );
}
