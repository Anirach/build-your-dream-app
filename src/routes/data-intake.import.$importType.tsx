import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  clampStep,
  clearDraft,
  draftIsStarted,
  emptyDraft,
  furthestReachableStep,
  isStepComplete,
  lastStep,
  loadDraft,
  saveDraft,
  stagedRows,
  stepIssues,
  warningRows,
  wizardSteps,
  type WizardDraft,
} from "@/demo-data/import-wizard";
import { useDemoState } from "@/demo-data/store";
import type { IntakeReceiptView } from "@/demo-data/types";

export const Route = createFileRoute("/data-intake/import/$importType")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: clampStep(search["step"] ?? 0),
  }),
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

function ImportWizardPage() {
  const { importType } = Route.useLoaderData();
  const { step: urlStep } = Route.useSearch();
  const dataset = datasetFor(importType)!;
  const navigate = useNavigate();
  const { commitImport, can } = useDemoState();

  // Draft is restored from the session after hydration so SSR output stays stable.
  const [draft, setDraft] = useState<WizardDraft>(() => emptyDraft(importType));
  const [restored, setRestored] = useState(false);
  const [receipt, setReceipt] = useState<IntakeReceiptView | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    setDraft(loadDraft(importType));
    setRestored(true);
  }, [importType]);

  const update = useCallback((patch: Partial<WizardDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      saveDraft(next);
      return next;
    });
    setShowIssues(false);
  }, []);

  const reachable = furthestReachableStep(dataset, draft);
  const step = Math.min(urlStep, reachable);

  const goToStep = useCallback(
    (next: number) => {
      setShowIssues(false);
      void navigate({
        to: "/data-intake/import/$importType",
        params: { importType },
        search: { step: clampStep(next) },
        replace: false,
      });
    },
    [importType, navigate],
  );

  // Keep the URL honest: a deep link past an incomplete step snaps back.
  useEffect(() => {
    if (restored && urlStep > reachable) {
      void navigate({
        to: "/data-intake/import/$importType",
        params: { importType },
        search: { step: reachable },
        replace: true,
      });
    }
  }, [restored, urlStep, reachable, importType, navigate]);

  const staged = useMemo(() => stagedRows(dataset, draft), [dataset, draft]);
  const counts = useMemo(() => countOutcomes(staged), [staged]);
  const allCounts = useMemo(() => countOutcomes(dataset.rows), [dataset]);
  const warnings = warningRows(dataset, draft);
  const issues = stepIssues(dataset, draft, step);
  const canAdvance = step === lastStep || issues.length === 0;
  const started = draftIsStarted(draft);

  const toggleRow = (row: number, excluded: boolean) => {
    const set = new Set(draft.excludedRows);
    if (excluded) set.add(row);
    else set.delete(row);
    update({ excludedRows: Array.from(set).sort((a, b) => a - b), acknowledged: false });
  };

  const resetDraft = () => {
    clearDraft(importType);
    setDraft(emptyDraft(importType));
    setReceipt(null);
    goToStep(0);
    toast.success("Draft discarded", { description: "The wizard was reset to step one." });
  };

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
          <div className="flex flex-wrap gap-2">
            {started && (
              <Button variant="outline" size="sm" onClick={resetDraft}>
                <RotateCcw className="size-4" aria-hidden /> Discard draft
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link to="/data-intake">
                <ArrowLeft className="size-4" aria-hidden /> Back to intake
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <SyntheticIntakeWarning />
        <RoleAccessNotice permissions={["intake.import"]} />

        {started && draft.committedReceiptId === null && step > 0 && (
          <NoticeBanner tone="info">
            <p className="text-muted-foreground">
              Draft restored for this session. You can leave this page and come back without losing
              your progress; step {step + 1} of {wizardSteps.length} is where you left off.
            </p>
          </NoticeBanner>
        )}

        <ol className="flex flex-wrap gap-2">
          {wizardSteps.map((s, i) => {
            const complete = i < lastStep && isStepComplete(dataset, draft, i) && i < reachable;
            const unlocked = i <= reachable;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => goToStep(i)}
                  className="rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                  aria-current={i === step ? "step" : undefined}
                >
                  <StatusBadge
                    label={`${i + 1}. ${s.label}`}
                    tone={i === step ? "info" : complete ? "success" : "neutral"}
                  />
                </button>
              </li>
            );
          })}
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
                value={draft.reason}
                onChange={(e) => update({ reason: e.target.value })}
                placeholder="For example: SCH-001 rev C re-baseline for the commissioning schedule."
              />
              <p className="text-xs text-muted-foreground">
                Minimum eight characters. {draft.reason.trim().length} entered.
              </p>
            </div>
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard
            title="Load the synthetic sample"
            description="No real file is uploaded in this mockup. Loading the sample stages the rows for validation."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={draft.loaded ? "outline" : "default"}
                onClick={() => update({ loaded: true })}
              >
                {draft.loaded ? "Sample loaded" : "Load sample file"}
              </Button>
              {draft.loaded && (
                <>
                  <StatusBadge label={`${dataset.rows.length} rows staged`} tone="success" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      update({
                        loaded: false,
                        mappingConfirmed: false,
                        acknowledged: false,
                        excludedRows: [],
                      })
                    }
                  >
                    Unload
                  </Button>
                </>
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
            <label className="mt-4 flex items-start gap-3 text-sm">
              <Checkbox
                checked={draft.mappingConfirmed}
                onCheckedChange={(v) => update({ mappingConfirmed: v === true })}
                aria-label="Confirm the column mapping"
              />
              <span className="text-muted-foreground">
                I confirm this mapping matches the source file and the governed fields.
              </span>
            </label>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard
            title="Validation preview"
            description="Rows are classified before anything is written. Exclude a row to keep it out of the commit; rejected rows are never committed."
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={`${counts.accepted} accepted`} tone="success" />
                <StatusBadge label={`${counts.warnings} warnings`} tone="warning" />
                <StatusBadge label={`${counts.rejected} rejected`} tone="danger" />
                <StatusBadge label={`${counts.noChange} unchanged`} tone="neutral" />
                {draft.excludedRows.length > 0 && (
                  <StatusBadge label={`${draft.excludedRows.length} excluded`} tone="neutral" />
                )}
              </div>
            }
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[780px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Include</TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Issue and suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataset.rows.map((r) => {
                    const excluded = draft.excludedRows.includes(r.row);
                    return (
                      <TableRow key={r.row} className={excluded ? "opacity-55" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={!excluded}
                            onCheckedChange={(v) => toggleRow(r.row, v !== true)}
                            aria-label={`Include row ${r.row} (${r.reference})`}
                          />
                        </TableCell>
                        <TableCell className="tnum">{r.row}</TableCell>
                        <TableCell className="font-medium text-navy">{r.reference}</TableCell>
                        <TableCell>{r.summary}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={excluded ? "Excluded" : r.outcome}
                            tone={
                              excluded
                                ? "neutral"
                                : r.outcome === "Accepted"
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {warnings.length > 0 && (
              <div className="mt-4">
                <AcknowledgeWarnings
                  checked={draft.acknowledged}
                  onChange={(v) => update({ acknowledged: v })}
                  count={warnings.length}
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
            <KeyValue
              items={[
                { label: "Reason", value: draft.reason },
                {
                  label: "Rows staged",
                  value: `${staged.length} of ${dataset.rows.length} (${draft.excludedRows.length} excluded)`,
                },
                {
                  label: "Outcome mix",
                  value: `${counts.accepted} accepted, ${counts.warnings} with warnings, ${counts.rejected} rejected, ${counts.noChange} unchanged`,
                },
                {
                  label: "Warnings acknowledged",
                  value: warnings.length === 0 ? "None to acknowledge" : draft.acknowledged ? "Yes" : "No",
                },
              ]}
            />
            <NoticeBanner tone="info">
              <p className="text-muted-foreground">
                {counts.accepted} rows will be accepted and {counts.warnings} accepted with
                warnings. {counts.rejected} rejected and {draft.excludedRows.length} excluded rows
                are not written. Original sample held {allCounts.rejected} rejected rows.
              </p>
            </NoticeBanner>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PermissionButton
                permission="intake.import"
                disabled={draft.committedReceiptId !== null}
                onClick={() => {
                  const result = commitImport({
                    importType: dataset.importType,
                    sourceName: dataset.sampleName,
                    reason: draft.reason,
                    mapping: dataset.columns.map((c) => ({ ...c })),
                    rows: staged,
                    acknowledgedWarnings: draft.acknowledged,
                  });
                  if (result) {
                    setReceipt(result);
                    update({ committedReceiptId: result.id });
                    toast.success("Import committed", {
                      description: `Receipt ${result.id} recorded on the audit trail.`,
                    });
                  }
                }}
              >
                <Check className="size-4" aria-hidden />{" "}
                {draft.committedReceiptId ? "Already committed" : "Commit import"}
              </PermissionButton>
              {draft.committedReceiptId && (
                <StatusBadge label={`Receipt ${draft.committedReceiptId}`} tone="success" />
              )}
            </div>
          </SectionCard>
        )}

        {showIssues && issues.length > 0 && (
          <NoticeBanner tone="warning">
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </NoticeBanner>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {step === 0 ? (
            <Button asChild variant="outline">
              <Link to="/data-intake">
                <ArrowLeft className="size-4" aria-hidden /> Leave wizard
              </Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={() => goToStep(step - 1)}>
              <ArrowLeft className="size-4" aria-hidden /> Back to {wizardSteps[step - 1]!.label}
            </Button>
          )}
          {step < lastStep ? (
            <Button
              onClick={() => (canAdvance ? goToStep(step + 1) : setShowIssues(true))}
              aria-disabled={!canAdvance}
              variant={canAdvance ? "default" : "outline"}
            >
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                if (draft.committedReceiptId) clearDraft(importType);
                void navigate({ to: "/data-intake" });
              }}
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
