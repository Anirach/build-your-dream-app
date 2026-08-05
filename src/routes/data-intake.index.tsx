import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, FileInput } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import { OwnerNotificationsCard, ProposalActivityFeed } from "@/components/app/intake-activity";
import { RoleAccessNotice } from "@/components/app/permission";
import {
  CorrectionModal,
  DataSourceCard,
  DataSourceDetailDrawer,
  ImportReceiptDrawer,
  ImportReceiptTable,
  ProgrammeRecordFormShell,
  QuickAddRecordMenu,
  ReversalChainView,
  SyntheticIntakeWarning,
} from "@/components/app/intake";
import { EmptyState, MetricCard, SectionCard } from "@/components/app/primitives";
import { StateBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataSources, importDatasets, recordKindLabels } from "@/demo-data/intake";
import { useDemoState } from "@/demo-data/store";
import type {
  DataSourceStatusView,
  IntakeRecordKind,
  IntakeReceiptView,
  ProgrammeRecordDraft,
} from "@/demo-data/types";

const TITLE = "Governed data intake - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Authoritative source catalogue, governed quick add, guided imports with receipts, append-only man-day corrections and module-registry change proposals. Synthetic data only.";

export const Route = createFileRoute("/data-intake/")({
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
  component: DataIntakePage,
});

function DataIntakePage() {
  const { intakeRecords, receipts, proposals, activeModules } = useDemoState();
  const [source, setSource] = useState<DataSourceStatusView | null>(null);
  const [formKind, setFormKind] = useState<IntakeRecordKind | null>(null);
  const [correcting, setCorrecting] = useState<ProgrammeRecordDraft | null>(null);
  const [receipt, setReceipt] = useState<IntakeReceiptView | null>(null);

  const pending = proposals.filter((p) => p.status === "Pending owner approval");
  const attention = dataSources.filter((s) => s.health !== "Healthy");

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Home", to: "/" }, { label: "Data intake" }]}
        title="Governed data intake"
        subtitle="Every programme record enters through a governed path with an owner, a reason and a receipt. Nothing is edited in place and nothing is deleted."
        primary={<QuickAddRecordMenu onPick={setFormKind} />}
        secondary={
          <Button asChild variant="outline" size="sm">
            <Link to="/data-intake/import/$importType" params={{ importType: "schedule" }}>
              <FileInput className="size-4" aria-hidden /> Start guided import
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <SyntheticIntakeWarning />
        <RoleAccessNotice permissions={["intake.record.add", "intake.import", "registry.propose"]} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Catalogued sources"
            value={dataSources.length}
            hint="Authoritative sources with a defined intake method."
          />
          <MetricCard
            label="Sources needing attention"
            value={attention.length}
            hint="Health is not Healthy: definition or load issues."
          />
          <MetricCard
            label="Session records added"
            value={intakeRecords.length}
            hint="Governed quick-add records held in this session."
          />
          <MetricCard
            label="Registry proposals pending"
            value={pending.length}
            hint="Module-registry changes awaiting owner approval."
          />
        </div>

        <SectionCard
          title="Authoritative source catalogue"
          description="Where each data type comes from, who owns it, how it is loaded in this mockup and the intended production path."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dataSources.map((s) => (
              <DataSourceCard key={s.id} source={s} onOpen={() => setSource(s)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Guided imports"
          description="Five-step wizard: choose source and reason, load the synthetic sample, confirm the column mapping, review validation, then commit and keep the receipt."
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {importDatasets.map((d) => (
              <li
                key={d.importType}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{d.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{d.sampleName}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/data-intake/import/$importType" params={{ importType: d.importType }}>
                    Open wizard
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Session programme records"
          description="Records added through governed quick add. Corrections keep the original value and append a history entry."
        >
          {intakeRecords.length === 0 ? (
            <EmptyState
              title="No records added in this session"
              description="Use Add programme record to raise a risk, decision, obligation, deliverable, evidence item or work package."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intakeRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-navy">{r.id}</TableCell>
                      <TableCell>{recordKindLabels[r.kind]}</TableCell>
                      <TableCell className="max-w-[280px]">{r.title}</TableCell>
                      <TableCell>{r.moduleCode}</TableCell>
                      <TableCell>{r.owner}</TableCell>
                      <TableCell>
                        <StateBadge state={r.status} />
                      </TableCell>
                      <TableCell className="tnum">{r.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setCorrecting(r)}>
                          Correct
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Man-day ledger corrections"
          description="Accounting-style corrections: original, reversal, replacement, all under one chain."
        >
          <ReversalChainView />
        </SectionCard>

        <SectionCard
          title="Import receipts"
          description="Every guided import produces a receipt with counts, mapping, validation issues and a trace ID."
          actions={<StatusBadge label={`${receipts.length} receipts`} tone="neutral" />}
        >
          <ImportReceiptTable onOpen={setReceipt} />
        </SectionCard>

        <SectionCard
          title="Module registry"
          description="The governed registry cannot be edited directly. Changes are proposed, validated and approved by the programme owner."
          actions={
            <StatusBadge label={`${activeModules.length} modules in force`} tone="info" />
          }
        >
          {proposals.length === 0 ? (
            <EmptyState title="No registry change proposals" description="Nothing proposed yet." />
          ) : (
            <ul className="space-y-3">
              {proposals.map((p) => (
                <li key={p.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">
                        {p.id} · {p.changeType}: {p.moduleCode} {p.moduleName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.rationale}</p>
                      <p className="tnum mt-1 text-xs text-muted-foreground">
                        Requested by {p.requestedBy} · {p.requestedAt} · effective {p.effectiveDate}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={p.status}
                        tone={
                          p.status === "Approved"
                            ? "success"
                            : p.status === "Rejected"
                              ? "danger"
                              : "warning"
                        }
                      />
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/data-intake/proposals/$proposalId"
                          params={{ proposalId: p.id }}
                        >
                          Review proposal
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="size-3.5" aria-hidden /> Approved proposals update the session
            registry and appear on the Programme pages.
          </p>
        </SectionCard>

        <OwnerNotificationsCard />
        <ProposalActivityFeed />
      </div>

      <DataSourceDetailDrawer source={source} onClose={() => setSource(null)} />
      <ProgrammeRecordFormShell kind={formKind} onClose={() => setFormKind(null)} />
      <CorrectionModal record={correcting} onClose={() => setCorrecting(null)} />
      <ImportReceiptDrawer receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}