// Tab C: Knowledge quality gates. Honest zeros - no licensed corpus is present.
import { NoticeBanner, MetricCard, SectionCard, SegmentedBar } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  citationChecks,
  citationTone,
  corpusManifest,
  corpusSummary,
  modelRegistry,
  retrievalEvaluation,
} from "@/demo-data/knowledge-qa";

export function ReadinessKnowledge() {
  return (
    <div className="space-y-6">
      <NoticeBanner tone="warning">
        No licensed standard text is loaded and none is invented. Chapter codes and identifiers below
        are neutral placeholders, and every quality metric is an honest zero until a production
        corpus is supplied.
      </NoticeBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Corpus units received"
          value={`${corpusSummary.receivedUnits} / ${corpusSummary.expectedUnits}`}
          hint="Expected chapter units against what has arrived"
        />
        <MetricCard
          label="Verified identifiers"
          value={`${corpusSummary.verifiedIds} / ${corpusSummary.requiredIds}`}
          hint="Identifiers confirmed against an authoritative source"
        />
        <MetricCard
          label="Crosswalk coverage"
          value={corpusSummary.crosswalkCoverage}
          hint="Cannot be computed without the corpus"
        />
        <MetricCard
          label="Full-text gate"
          value={corpusSummary.fullTextGate}
          hint="Licensing and access decision outstanding"
        />
      </div>

      <SectionCard
        title="Corpus manifest"
        description={`${corpusSummary.placeholderRecords} placeholder records stand in for the real chapter set. Nothing here is quotable text.`}
        bodyClassName="px-0 py-0"
      >
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Expected IDs</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Edition</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corpusManifest.map((u) => (
                <TableRow key={u.code}>
                  <TableCell className="font-semibold">{u.code}</TableCell>
                  <TableCell>{u.title}</TableCell>
                  <TableCell className="tnum text-right">{u.expectedIds}</TableCell>
                  <TableCell className="tnum text-right">{u.receivedIds}</TableCell>
                  <TableCell className="text-muted-foreground">{u.edition}</TableCell>
                  <TableCell>
                    <StatusBadge label={u.state} tone="danger" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard
        title="Citation validation behaviour"
        description="Demonstration of the rules that would run against a production corpus. Unknown or malformed identifiers never reach an approved mapping."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Citation</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Rule applied</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Raised by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citationChecks.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-semibold">{row.id}</TableCell>
                  <TableCell className="tnum">{row.citation}</TableCell>
                  <TableCell>
                    <StatusBadge label={row.outcome} tone={citationTone(row.outcome)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.rule}</TableCell>
                  <TableCell className="max-w-[280px] text-muted-foreground">{row.detail}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.raisedBy}
                    <br />
                    {row.at}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Retrieval evaluation gate"
          description="A fixed query set must exist before any retrieval claim can be made."
        >
          <SegmentedBar
            segments={[
              {
                label: "Completed queries",
                value: retrievalEvaluation.completedQueries,
                className: "bg-success",
              },
              {
                label: "Outstanding queries",
                value: retrievalEvaluation.fixedSetRequired - retrievalEvaluation.completedQueries,
                className: "bg-muted",
              },
            ]}
          />
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Top-5 accuracy</dt>
              <dd className="font-medium">{retrievalEvaluation.topFive}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Gate threshold</dt>
              <dd className="font-medium">{retrievalEvaluation.gateThreshold}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last run</dt>
              <dd className="font-medium">{retrievalEvaluation.lastRun}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fixed set available</dt>
              <dd className="font-medium">
                {retrievalEvaluation.fixedSetAvailable} of {retrievalEvaluation.fixedSetRequired}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <NoticeBanner tone="warning">
              Evaluation cannot run: {retrievalEvaluation.disabledReason}.
            </NoticeBanner>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Re-run triggers
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {retrievalEvaluation.rerunTriggers.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Model and configuration registry"
          description="Placeholder entries only. No configuration is approved for production use."
          bodyClassName="px-0 py-0"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelRegistry.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-semibold">{m.id}</TableCell>
                    <TableCell>{m.model}</TableCell>
                    <TableCell className="max-w-[260px] text-muted-foreground">
                      {m.configuration}
                      <span className="mt-1 block text-xs">{m.changeReason}</span>
                    </TableCell>
                    <TableCell className="tnum text-xs">{m.version}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={m.approved}
                        tone={m.approved === "Approved" ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}