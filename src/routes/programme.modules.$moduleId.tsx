import { createFileRoute, notFound } from "@tanstack/react-router";

import { PageHeader } from "@/components/app/page-header";
import { KeyValue, SectionCard, SegmentedBar } from "@/components/app/primitives";
import { RagBadge, RuleResultBadge, StateBadge } from "@/components/app/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  dependencies,
  deliverables,
  evidenceCompleteness,
  evidenceItems,
  moduleByCode,
  moduleStatusDrivers,
  risks,
  workPackages,
} from "@/demo-data/modules";
import { personName } from "@/demo-data/people";

export const Route = createFileRoute("/programme/modules/$moduleId")({
  loader: ({ params }) => {
    const module = moduleByCode(params.moduleId);
    if (!module) throw notFound();
    return { module };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.module.code} ${loaderData.module.label} - BDMS Intelligence` },
          {
            name: "description",
            content: `Synthetic readiness detail for ${loaderData.module.code}: rule drivers, work packages, risks and evidence completeness.`,
          },
          {
            property: "og:title",
            content: `${loaderData.module.code} ${loaderData.module.label} - BDMS Intelligence`,
          },
          {
            property: "og:description",
            content: "Module readiness drill-down in the BDMS Intelligence concept mockup.",
          },
        ]
      : [{ title: "Module not found" }, { name: "robots", content: "noindex" }],
  }),
  component: ModuleDetail,
});

function ModuleDetail() {
  const { module } = Route.useLoaderData();
  const drivers = moduleStatusDrivers[module.code] ?? [];
  const packages = workPackages[module.code] ?? [];
  const moduleRisks = risks[module.code] ?? [];
  const moduleDeps = dependencies[module.code] ?? [];
  const moduleDeliverables = deliverables[module.code] ?? [];
  const evidence = evidenceItems[module.code] ?? [];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "SHSIRC - Dhaka", to: "/" },
          { label: "Programme", to: "/programme" },
          { label: module.code },
        ]}
        title={`${module.code} - ${module.label}`}
        subtitle={`${module.estate} · ${module.stage} · Next gate ${module.nextGate}`}
        primary={<RagBadge rag={module.rag} size="lg" />}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="Why this module has its status">
          {drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Detailed rule traces are only populated for M03 in this mockup.
            </p>
          ) : (
            <ul className="space-y-3">
              {drivers.map((d) => (
                <li key={d.rule} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">{d.rule}</p>
                    <RuleResultBadge result={d.result} />
                  </div>
                  <p className="tnum mt-2 text-xs text-muted-foreground">
                    {d.value} against {d.threshold} · source {d.source}
                  </p>
                  <p className="mt-1.5 text-sm">{d.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Module facts">
          <KeyValue
            items={[
              { label: "Owner", value: personName(module.ownerId) },
              { label: "Progress", value: `${module.progress}%` },
              {
                label: "Baseline variance",
                value: `${module.baselineVarianceDays > 0 ? "+" : ""}${module.baselineVarianceDays} days`,
              },
              { label: "Overdue packages", value: module.overduePackages },
              { label: "Open risks", value: module.openRisks },
              { label: "Critical issues", value: module.criticalIssues },
              { label: "Evidence gaps", value: module.evidenceGaps },
              { label: "Baseline", value: "BL0 - SCH-001" },
            ]}
          />
          <SegmentedBar
            className="mt-5"
            segments={[
              { label: "Present", value: evidenceCompleteness.present, className: "bg-success" },
              { label: "Partial", value: evidenceCompleteness.partial, className: "bg-warning" },
              { label: "Missing", value: evidenceCompleteness.missing, className: "bg-danger" },
              { label: "Unverified", value: evidenceCompleteness.unverified, className: "bg-info" },
            ]}
          />
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Work packages" bodyClassName="px-0 py-0">
          <SimpleTable
            headers={["ID", "Name", "Owner", "Due", "State"]}
            rows={packages.map((p) => [p.id, p.name, p.owner, p.due, <StateBadge key={p.id} state={p.state} />])}
          />
        </SectionCard>
        <SectionCard title="Risks" bodyClassName="px-0 py-0">
          <SimpleTable
            headers={["ID", "Title", "Severity", "Status"]}
            rows={moduleRisks.map((r) => [
              r.id,
              r.title,
              <StateBadge key={`${r.id}-s`} state={r.severity} />,
              r.status,
            ])}
          />
        </SectionCard>
        <SectionCard title="Dependencies" bodyClassName="px-0 py-0">
          <SimpleTable
            headers={["ID", "Title", "From", "Forecast", "State"]}
            rows={moduleDeps.map((d) => [
              d.id,
              d.title,
              d.from,
              d.forecast,
              <StateBadge key={d.id} state={d.state} />,
            ])}
          />
        </SectionCard>
        <SectionCard title="Deliverables" bodyClassName="px-0 py-0">
          <SimpleTable
            headers={["ID", "Name", "Stage", "Due", "State"]}
            rows={moduleDeliverables.map((d) => [
              d.id,
              d.name,
              d.stage,
              d.due,
              <StateBadge key={d.id} state={d.state} />,
            ])}
          />
        </SectionCard>
      </div>

      <SectionCard className="mt-5" title="Evidence register" bodyClassName="px-0 py-0">
        <SimpleTable
          headers={["ID", "Item", "Requirement", "Reference", "Updated", "State"]}
          rows={evidence.map((e) => [
            e.id,
            e.name,
            e.requirement,
            e.reference,
            e.updated,
            <StateBadge key={e.id} state={e.state} />,
          ])}
        />
      </SectionCard>
    </>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-muted-foreground">
        No synthetic records for this module in the mockup.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j} className={j === 0 ? "tnum font-medium text-navy" : undefined}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}