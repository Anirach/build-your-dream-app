// Tab D: Governed review packages and import validation. Simulated round trip only.
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { KeyValue, NoticeBanner, SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { goldSetGate, packageTone, workflowSteps } from "@/demo-data/review-packages";
import { useDemoState } from "@/demo-data/store";
import { cn } from "@/lib/utils";

export function ReadinessPackages() {
  const { reviewPackages, approveReviewPackage } = useDemoState();
  const [selectedId, setSelectedId] = useState(reviewPackages[0]?.id ?? "");
  const [note, setNote] = useState("");

  const pack = reviewPackages.find((p) => p.id === selectedId) ?? reviewPackages[0];
  if (!pack) return null;
  const blocked = pack.validation.filter((r) => r.blocked);

  return (
    <div className="space-y-6">
      <NoticeBanner>
        No workbook is generated or parsed here. The export and import steps are simulated to show
        the governed round trip: reviewers cannot change protected identifiers, stale or duplicate
        workbooks are refused, and nothing is auto-approved.
      </NoticeBanner>

      <SectionCard
        title="Governed round trip"
        description="Every stage must pass before a mapping becomes approved and an immutable audit event is written."
      >
        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {workflowSteps.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-secondary px-2.5 py-1 font-semibold text-navy">
                {i + 1}. {step}
              </span>
              {i < workflowSteps.length - 1 && (
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Review packages"
        description="Four synthetic packages illustrate each outcome: draft blocked on citations, exported and awaiting return, returned and rejected, and validated awaiting approval."
        bodyClassName="px-0 py-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>SOP / module</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="text-right">Invalid citations</TableHead>
                <TableHead className="text-right">Changed rows</TableHead>
                <TableHead>Import validation</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewPackages.map((p) => (
                <TableRow key={p.id} className={cn(p.id === pack.id && "bg-soft-blue/60")}>
                  <TableCell className="font-semibold">
                    {p.id}
                    <span className="ml-1 text-xs text-muted-foreground">{p.version}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block">{p.sopRef}</span>
                    <span className="block text-xs text-muted-foreground">{p.moduleCode}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.reviewer}</TableCell>
                  <TableCell className="tnum text-right">{p.invalidCitations}</TableCell>
                  <TableCell className="tnum text-right">{p.changedRows}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={p.importState}
                      tone={
                        p.importState === "Validated"
                          ? "success"
                          : p.importState.startsWith("Blocked")
                            ? "danger"
                            : "neutral"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={p.state} tone={packageTone(p.state)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Inspect
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title={`${pack.id} ${pack.version} - import validation`}
          description="Row-level outcomes with the rule that produced each one."
          actions={<StatusBadge label={pack.state} tone={packageTone(pack.state)} />}
        >
          {pack.validation.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No validation rows yet. This package is still awaiting the reviewer workbook.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Row</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Explanation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pack.validation.map((row, i) => (
                    <TableRow key={`${row.row}-${i}`}>
                      <TableCell className="tnum text-right">{row.row}</TableCell>
                      <TableCell>
                        <StatusBadge label={row.outcome} tone={row.blocked ? "danger" : "success"} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.field}</TableCell>
                      <TableCell className="max-w-[200px] text-xs">{row.value}</TableCell>
                      <TableCell className="max-w-[300px] text-muted-foreground">
                        {row.explanation}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-5">
            <KeyValue
              items={[
                { label: "Run", value: pack.runId },
                { label: "Model", value: pack.model },
                { label: "Prompt hash", value: pack.promptHash },
                { label: "Manifest checksum", value: pack.manifestChecksum },
                { label: "Exported", value: `${pack.exportedBy} · ${pack.exportedAt}` },
                { label: "Returned workbook", value: pack.returnedWorkbook },
                { label: "Due", value: pack.due },
                { label: "Audit reference", value: pack.auditRef },
              ]}
            />
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Reviewer approval" description="Approval is refused while any row is blocked.">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Reason for approval"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {blocked.length > 0 && (
              <div className="mt-3">
                <NoticeBanner tone="warning">
                  {blocked.length} row(s) are blocked. Nothing can be approved until the reviewer
                  returns a clean workbook against the current export version.
                </NoticeBanner>
              </div>
            )}
            <PermissionButton
              permission="review.package"
              className="mt-3 w-full"
              disabled={pack.state !== "Validated - awaiting reviewer approval" || blocked.length > 0}
              onClick={() => {
                if (!note.trim()) {
                  toast.error("A reason is required");
                  return;
                }
                if (approveReviewPackage(pack.id, note.trim())) {
                  toast.success(`${pack.id} approved`, {
                    description: "Approved mapping recorded with an immutable audit event (simulated).",
                  });
                  setNote("");
                } else {
                  toast.error("Approval refused", {
                    description: "This package is not in a state that can be approved.",
                  });
                }
              }}
            >
              Approve mapping
            </PermissionButton>
          </SectionCard>

          <SectionCard
            title="Gold set gate"
            description="Precision and recall cannot be claimed until a reviewed gold set exists."
          >
            <KeyValue
              items={[
                {
                  label: "Gold set SOPs",
                  value: `${goldSetGate.availableSops} of ${goldSetGate.requiredSops}`,
                },
                { label: "Reviewers", value: goldSetGate.reviewers },
                { label: "Precision target", value: goldSetGate.precisionTarget },
                { label: "Precision result", value: goldSetGate.precisionResult },
                { label: "Recall", value: goldSetGate.recallMeasure },
              ]}
            />
            <div className="mt-3">
              <StatusBadge label={goldSetGate.overall} tone="warning" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}