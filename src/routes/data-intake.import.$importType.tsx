import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AcknowledgeWarnings,
  ImportReceiptDrawer,
  SyntheticIntakeWarning,
} from "@/components/app/intake";
import { PageHeader } from "@/components/app/page-header";
import { PermissionButton, RoleAccessNotice } from "@/components/app/permission";
import { KeyValue, NoticeBanner, SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { countOutcomes, datasetFor } from "@/demo-data/intake";
import { useDemoState } from "@/demo-data/store";
import type { IntakeReceiptView } from "@/demo-data/types";

export const Route = createFileRoute("/data-intake/import/$importType")({
  loader: ({ params }) => {
    const dataset = datasetFor(params.importType);
    if (!dataset) throw notFound();
    return { importType: params.importType };
  },
  head: ({ params }) => {
    const dataset = datasetFor(params.importType);
    const title = `Guided import: ${dataset?.label ?? "Unavailable"} - BDMS Intelligence Mockup`;
    const description =
      "Five-step guided import for synthetic programme data: source and reason, sample load, column mapping, validation review, commit with receipt.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ImportWizardPage,
});

const steps = [
  { key: "source", label: "Source and reason" },
  { key: "sample", label: "Load sample" },
  { key: "mapping", label: "Column mapping" },
  { key: "validation", label: "Validation" },
  { key: "commit", label: "Commit and receipt" },
];

function ImportWizardPage() {
  const { importType } = Route.useLoaderData();
  const dataset = datasetFor(importType)!;
  const navigate = useNavigate();
  const { commitImport, can } = useDemoState();

  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [receipt, setReceipt] = useState<IntakeReceiptView | null>(null);

  const counts = useMemo(() => countOutcomes(dataset.rows), [dataset]);
  const canAdvance =
    (step === 0 && reason.trim().length >= 8) ||
    (step === 1 && loaded) ||
    step === 2 ||
    (step === 3 && (counts.warnings === 0 || acknowledged));

  return (
    <div>
      <PageHeader
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Data intake", to: "/data-intake" },
          { label: "Guided import" },
        ]}
        title={`Guided import: ${dataset.label}`}
        subtitle="Imports are staged and validated before anything is committed. The result is a receipt, not a silent overwrite."
        secondary={
          <Button asChild variant="outline" size="sm">
            <Link to="/data-intake">
              <ArrowLeft className="size-4" aria-hidden /> Back to intake
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <SyntheticIntakeWarning />
        <RoleAccessNotice permissions={["intake.import"]} />

        <ol className="flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={s.key}>
              <StatusBadge
                label={`${i + 1}. ${s.label}`}
                tone={i < step ? "success" : i === step ? "info" : "neutral"}
              />
            </li>
          ))}
        </ol>

        {step === 0 && (
          <SectionCard
            title="Source and reason"
            description="Every import records who started it and why. The reason is stored on the receipt and the audit trail."
          >
            <KeyValue
              items={[
                { label: "Data type", value: dataset.label },
                { label: "Synthetic sample", value: dataset.sampleName },
                { label: "Intake method", value: "Guided import (mock upload)" },
              ]}
            />
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="import-reason">
                Reason for this load <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="import-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: SCH-001 rev C re-baseline for the commissioning schedule."
              />
              <p className="text-xs text-muted-foreground">Minimum eight characters.</p>
            </div>
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard
            title="Load the synthetic sample"
            description="No real file is uploaded in this mockup. Loading the sample stages the rows for validation."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={loaded ? "outline" : "default"} onClick={() => setLoaded(true)}>
                {loaded ? "Sample loaded" : "Load sample file"}
              </Button>
              {loaded && (
                <StatusBadge label={`${dataset.rows.length} rows staged`} tone="success" />
              )}
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard
            title="Confirm the column mapping"
            description="Source columns are mapped to governed fields. Required fields must be present before commit."
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Source column</TableHead>
                    <TableHead>Sample value</TableHead>
                    <TableHead>Governed field</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataset.columns.map((c) => (
                    <TableRow key={c.sourceColumn}>
                      <TableCell className="font-medium text-navy">{c.sourceColumn}</TableCell>
                      <TableCell className="text-muted-foreground">{c.sampleValue}</TableCell>
                      <TableCell>{c.expectedField}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={c.required ? "Required" : "Optional"}
                          tone={c.required ? "info" : "neutral"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard
            title="Validation preview"
            description="Rows are classified before anything is written. Rejected rows are never committed."
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={`${counts.accepted} accepted`} tone="success" />
                <StatusBadge label={`${counts.warnings} warnings`} tone="warning" />
                <StatusBadge label={`${counts.rejected} rejected`} tone="danger" />
                <StatusBadge label={`${counts.noChange} unchanged`} tone="neutral" />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Issue and suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataset.rows.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell className="tnum">{r.row}</TableCell>
                      <TableCell className="font-medium text-navy">{r.reference}</TableCell>
                      <TableCell>{r.summary}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={r.outcome}
                          tone={
                            r.outcome === "Accepted"
                              ? "success"
                              : r.outcome === "Warning"
                                ? "warning"
                                : r.outcome === "Rejected"
                                  ? "danger"
                                  : "neutral"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.issue
                          ? `${r.issue.field}: ${r.issue.problem}. ${r.issue.suggestion}.`
                          : r.outcome === "Warning"
                            ? "Review before accepting."
                            : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {counts.warnings > 0 && (
              <div className="mt-4">
                <AcknowledgeWarnings
                  checked={acknowledged}
                  onChange={setAcknowledged}
                  count={counts.warnings}
                />
              </div>
            )}
          </SectionCard>
        )}

        {step === 4 && (
          <SectionCard
            title="Commit and keep the receipt"
            description="Committing appends accepted rows to the session, writes a receipt and logs the load on the audit trail."
          >
            <NoticeBanner tone="info">
              <p className="text-muted-foreground">
                {counts.accepted} rows will be accepted, {counts.warnings} accepted with warnings and{" "}
                {counts.rejected} rejected. Reason: {reason}
              </p>
            </NoticeBanner>
            <div className="mt-4">
              <PermissionButton
                permission="intake.import"
                onClick={() => {
                  const result = commitImport({
                    importType: dataset.importType,
                    sourceName: dataset.sampleName,
                    reason,
                    mapping: dataset.columns.map((c) => ({ ...c })),
                    rows: dataset.rows,
                    acknowledgedWarnings: acknowledged,
                  });
                  if (result) {
                    setReceipt(result);
                    toast.success("Import committed", {
                      description: `Receipt ${result.id} recorded on the audit trail.`,
                    });
                  }
                }}
              >
                <Check className="size-4" aria-hidden /> Commit import
              </PermissionButton>
            </div>
          </SectionCard>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Button>
          {step < 4 ? (
            <Button disabled={!canAdvance} onClick={() => setStep((s) => Math.min(4, s + 1))}>
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/data-intake" })}
              disabled={!can("intake.import")}
            >
              Finish
            </Button>
          )}
        </div>
      </div>

      <ImportReceiptDrawer receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}