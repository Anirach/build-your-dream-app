// Concept-only presentation components for governed data intake.
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  CircleCheck,
  FileInput,
  Plus,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { KeyValue, NoticeBanner } from "@/components/app/primitives";
import { StateBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  formFor,
  healthTone,
  intakeForms,
  ledgerChains,
  recordKindLabels,
  SYNTHETIC_WARNING,
  validateRecord,
} from "@/demo-data/intake";
import { useDemoState } from "@/demo-data/store";
import type {
  DataSourceStatusView,
  IntakeRecordKind,
  IntakeReceiptView,
  LedgerEntryView,
  ProgrammeRecordDraft,
} from "@/demo-data/types";

export function SyntheticIntakeWarning() {
  return (
    <NoticeBanner tone="warning">
      <p className="font-semibold text-navy">Synthetic data only</p>
      <p className="mt-0.5 text-muted-foreground">{SYNTHETIC_WARNING}</p>
    </NoticeBanner>
  );
}

/* ------------------------------- Data sources ------------------------------ */

export function DataSourceCard({
  source,
  onOpen,
}: {
  source: DataSourceStatusView;
  onOpen: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{source.name}</h3>
        <StatusBadge
          label={source.health}
          tone={healthTone(source.health) as "success" | "warning" | "danger"}
          title={source.description}
        />
      </div>
      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div>
          <dt className="inline font-medium text-foreground">Authoritative source: </dt>
          <dd className="inline">{source.authoritativeSource}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Owner: </dt>
          <dd className="inline">{source.owner}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Intake method: </dt>
          <dd className="inline">{source.intakeMethod}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Last synthetic load: </dt>
          <dd className="tnum inline">{source.lastLoad}</dd>
        </div>
      </dl>
      <ul className="tnum mt-3 flex flex-wrap gap-2 text-xs">
        <li className="rounded-md border border-success/25 bg-success-surface px-2 py-0.5 text-success">
          {source.accepted} accepted
        </li>
        <li className="rounded-md border border-warning/30 bg-warning-surface px-2 py-0.5 text-warning">
          {source.warnings} warnings
        </li>
        <li className="rounded-md border border-danger/25 bg-danger-surface px-2 py-0.5 text-danger">
          {source.rejected} rejected
        </li>
      </ul>
      <div className="mt-auto pt-4">
        <Button variant="outline" size="sm" onClick={onOpen}>
          View details
        </Button>
      </div>
    </article>
  );
}

export function DataSourceDetailDrawer({
  source,
  onClose,
}: {
  source: DataSourceStatusView | null;
  onClose: () => void;
}) {
  const { receipts } = useDemoState();
  const related = receipts.filter(
    (r) => source && (source.receiptIds.includes(r.id) || r.dataType === source.name),
  );
  return (
    <Sheet open={!!source} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {source && (
          <>
            <SheetHeader>
              <SheetTitle className="text-navy">{source.name}</SheetTitle>
              <SheetDescription>{source.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              <KeyValue
                items={[
                  { label: "Authoritative source", value: source.authoritativeSource },
                  { label: "Source owner", value: source.owner },
                  { label: "Mock intake method", value: source.intakeMethod },
                  { label: "Intended production path", value: source.productionPath },
                  { label: "Last synthetic load", value: source.lastLoad },
                  {
                    label: "Health",
                    value: (
                      <StatusBadge
                        label={source.health}
                        tone={healthTone(source.health) as "success" | "warning" | "danger"}
                      />
                    ),
                  },
                ]}
              />
              <div>
                <h4 className="text-sm font-semibold text-navy">Expected fields</h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {source.expectedFields.map((f) => (
                    <li
                      key={f}
                      className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px]"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-navy">Validation rules</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {source.validationRules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-navy">Latest receipts</h4>
                {related.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No import receipts recorded for this source in this session.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {related.map((r) => (
                      <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
                        <p className="font-medium text-navy">{r.id}</p>
                        <p className="tnum mt-0.5 text-xs text-muted-foreground">
                          {r.accepted} accepted · {r.warnings} warnings · {r.rejected} rejected ·{" "}
                          {r.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {source.importType && (
                <Button asChild size="sm">
                  <Link
                    to="/data-intake/import/$importType"
                    params={{ importType: source.importType }} search={{ step: 0 }}
                    onClick={onClose}
                  >
                    <FileInput className="size-4" aria-hidden /> Start guided import
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------ Quick-add forms ---------------------------- */

export function QuickAddRecordMenu({ onPick }: { onPick: (kind: IntakeRecordKind) => void }) {
  const { can, denialReason } = useDemoState();
  const allowed = can("intake.record.add");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" title={allowed ? undefined : denialReason("intake.record.add")}>
          <Plus className="size-4" aria-hidden /> Add programme record
          <ChevronDown className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Governed quick add</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {intakeForms.map((form) => (
          <DropdownMenuItem
            key={form.kind}
            onSelect={(event) => {
              if (!allowed) {
                event.preventDefault();
                toast.error("Not authorised", { description: denialReason("intake.record.add") });
                return;
              }
              onPick(form.kind);
            }}
          >
            {form.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Adding a module is not available here. Use Propose registry change on the Module Registry
          card.
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProgrammeRecordFormShell({
  kind,
  onClose,
}: {
  kind: IntakeRecordKind | null;
  onClose: () => void;
}) {
  const { activeModules, addIntakeRecord, addLedgerEntry } = useDemoState();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "review">("form");
  const def = kind ? formFor(kind) : null;

  const reset = () => {
    setValues({});
    setErrors({});
    setStage("form");
  };

  const close = () => {
    reset();
    onClose();
  };

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = (asDraft: boolean) => {
    if (!kind) return;
    const found = validateRecord(kind, values);
    if (!asDraft && Object.keys(found).length > 0) {
      setErrors(found);
      setStage("form");
      toast.error("Fix the highlighted fields", {
        description: `${Object.keys(found).length} field(s) need attention before validation.`,
      });
      return;
    }
    if (kind === "manday" && !asDraft) {
      const entry = addLedgerEntry(values);
      if (!entry) return;
      toast.success(`Man-day entry ${entry.id} accepted`, {
        description: "Accepted entries cannot be overwritten. Corrections use reversal and replacement.",
      });
      close();
      return;
    }
    const record = addIntakeRecord({ kind, values, asDraft });
    if (!record) return;
    toast.success(`${recordKindLabels[kind]} ${record.id} ${asDraft ? "saved as draft" : "accepted"}`, {
      description: `Recorded against ${record.moduleCode}. The event is in Audit and Lineage.`,
      action: {
        label: "Open record",
        onClick: () => {
          const el = document.getElementById(record.id);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
    });
    close();
  };

  return (
    <Sheet open={!!kind} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {def && (
          <>
            <SheetHeader>
              <SheetTitle className="text-navy">{def.label}</SheetTitle>
              <SheetDescription>{def.purpose}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-10">
              <SyntheticIntakeWarning />
              {stage === "form" ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setValues({ ...def.example })}>
                      Use example data
                    </Button>
                    <span className="text-xs text-muted-foreground">{def.permissionNote}</span>
                  </div>
                  <div className="space-y-4">
                    {def.fields.map((field) => {
                      const id = `field-${field.key}`;
                      const value = values[field.key] ?? "";
                      const error = errors[field.key];
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label htmlFor={id}>
                            {field.label}
                            {field.required && (
                              <span className="text-danger" aria-label="required">
                                {" "}
                                *
                              </span>
                            )}
                          </Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              id={id}
                              value={value}
                              rows={3}
                              onChange={(e) => set(field.key, e.target.value)}
                            />
                          ) : field.type === "select" && field.key === "moduleCode" ? (
                            <Select value={value} onValueChange={(v) => set(field.key, v)}>
                              <SelectTrigger id={id}>
                                <SelectValue placeholder="Select a module" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeModules.map((m) => (
                                  <SelectItem key={m.code} value={m.code}>
                                    {m.code} - {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "select" ? (
                            <Select value={value} onValueChange={(v) => set(field.key, v)}>
                              <SelectTrigger id={id}>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options ?? []).map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={id}
                              type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                              value={value}
                              onChange={(e) => set(field.key, e.target.value)}
                            />
                          )}
                          {field.help && !error && (
                            <p className="text-xs text-muted-foreground">{field.help}</p>
                          )}
                          {error && (
                            <p role="alert" className="text-xs font-medium text-danger">
                              {error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {kind === "manday" && (
                    <NoticeBanner tone="info">
                      <p className="text-muted-foreground">
                        Accepted man-day entries cannot be overwritten. Corrections create a reversal
                        plus a replacement entry.
                      </p>
                    </NoticeBanner>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={close}>
                      Cancel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => submit(true)}>
                      Save draft
                    </Button>
                    <PermissionButton
                      permission="intake.record.add"
                      size="sm"
                      onClick={() => {
                        const found = validateRecord(kind!, values);
                        setErrors(found);
                        if (Object.keys(found).length > 0) {
                          toast.error("Fix the highlighted fields", {
                            description: `${Object.keys(found).length} field(s) need attention.`,
                          });
                          return;
                        }
                        setStage("review");
                      }}
                    >
                      Submit for validation
                    </PermissionButton>
                  </div>
                </>
              ) : (
                <>
                  <NoticeBanner tone="info">
                    <p className="font-semibold text-navy">Review before acceptance</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Nothing is recorded until you confirm. Status remains rule-calculated; no RAG
                      colour is selected here.
                    </p>
                  </NoticeBanner>
                  <KeyValue
                    items={def.fields
                      .filter((f) => (values[f.key] ?? "").trim())
                      .map((f) => ({ label: f.label, value: values[f.key] ?? "" }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStage("form")}>
                      Back to form
                    </Button>
                    <PermissionButton permission="intake.record.add" size="sm" onClick={() => submit(false)}>
                      <CircleCheck className="size-4" aria-hidden /> Confirm and accept
                    </PermissionButton>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------ Before / after ---------------------------- */

export function BeforeAfterComparison({
  rows,
}: {
  rows: { label: string; before: string; after: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.label}>
              <TableCell className="font-medium text-navy">{r.label}</TableCell>
              <TableCell className="text-muted-foreground">{r.before || "-"}</TableCell>
              <TableCell>{r.after || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------- Corrections ------------------------------ */

export function CorrectionModal({
  record,
  onClose,
}: {
  record: ProgrammeRecordDraft | null;
  onClose: () => void;
}) {
  const { correctIntakeRecord } = useDemoState();
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const before = record?.title ?? "";
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Correct record</DialogTitle>
          <DialogDescription>
            Governed records are never deleted. A correction stores a before and after history entry.
          </DialogDescription>
        </DialogHeader>
        {record && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="correct-title">Title</Label>
              <Input
                id="correct-title"
                value={value || before}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correct-reason">
                Correction reason <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="correct-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <BeforeAfterComparison
              rows={[{ label: "Title", before, after: value || before }]}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <PermissionButton
            permission="intake.record.add"
            size="sm"
            onClick={() => {
              if (!record) return;
              if (!reason.trim()) {
                toast.error("A correction reason is required");
                return;
              }
              const next = value || before;
              if (next === before) {
                toast.error("Change the value before confirming the correction");
                return;
              }
              if (correctIntakeRecord(record.id, "title", next, reason)) {
                toast.success(`Correction recorded on ${record.id}`, {
                  description: "Before and after history is preserved in Audit and Lineage.",
                });
                setValue("");
                setReason("");
                onClose();
              }
            }}
          >
            Confirm correction
          </PermissionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReversalChainView() {
  const { ledger, correctLedgerEntry } = useDemoState();
  const chains = useMemo(() => ledgerChains(ledger), [ledger]);
  const [target, setTarget] = useState<LedgerEntryView | null>(null);
  const [days, setDays] = useState("");
  const [wp, setWp] = useState("");
  const [activity, setActivity] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-4">
      <NoticeBanner tone="info">
        <p className="text-muted-foreground">
          The man-day ledger is append-only. There is no edit-in-place or delete: a correction keeps
          the original, appends a reversal, and adds a replacement entry.
        </p>
      </NoticeBanner>
      {chains.map((chain) => (
        <div key={chain.original.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-navy">{chain.original.activity}</p>
              <p className="tnum mt-0.5 text-xs text-muted-foreground">
                {chain.original.id} · {chain.original.moduleCode} {chain.original.workPackage} ·{" "}
                {chain.original.consultant} · recorded by {chain.original.recordedBy}
              </p>
            </div>
            {!chain.reversal && (
              <PermissionButton
                permission="intake.record.add"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTarget(chain.original);
                  setDays(String(chain.original.days));
                  setWp(chain.original.workPackage);
                  setActivity(chain.original.activity);
                  setReason("");
                }}
              >
                Correct by reversal
              </PermissionButton>
            )}
          </div>
          <ol className="mt-3 space-y-2">
            {[chain.original, chain.reversal, chain.replacement]
              .filter((e): e is LedgerEntryView => !!e)
              .map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <StateBadge
                      state={entry.kind === "Original" ? "Present" : entry.kind === "Reversal" ? "Rejected" : "Approved"}
                      title={`${entry.kind} entry`}
                    />
                    <span className="font-medium text-navy">{entry.kind}</span>
                    <span className="tnum text-muted-foreground">
                      {entry.id} · {entry.date} · {entry.days} day(s) · {entry.workPackage}
                    </span>
                  </span>
                  {entry.reason && (
                    <span className="text-xs text-muted-foreground">{entry.reason}</span>
                  )}
                </li>
              ))}
          </ol>
        </div>
      ))}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Correct man-day entry</DialogTitle>
            <DialogDescription>
              The original entry stays visible. A reversal and a replacement entry are appended.
            </DialogDescription>
          </DialogHeader>
          {target && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rev-days">Corrected days</Label>
                  <Input id="rev-days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rev-wp">Correct work package</Label>
                  <Input id="rev-wp" value={wp} onChange={(e) => setWp(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rev-activity">Activity description</Label>
                <Input id="rev-activity" value={activity} onChange={(e) => setActivity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rev-reason">
                  Correction reason <span className="text-danger">*</span>
                </Label>
                <Textarea id="rev-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <BeforeAfterComparison
                rows={[
                  { label: "Days", before: String(target.days), after: days },
                  { label: "Work package", before: target.workPackage, after: wp },
                  { label: "Activity", before: target.activity, after: activity },
                ]}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <PermissionButton
              permission="intake.record.add"
              size="sm"
              onClick={() => {
                if (!target) return;
                const parsed = Number(days);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  toast.error("Days must be greater than zero");
                  return;
                }
                if (!reason.trim()) {
                  toast.error("A correction reason is required");
                  return;
                }
                if (correctLedgerEntry(target.id, { days: parsed, workPackage: wp, activity, reason })) {
                  toast.success("Reversal and replacement appended", {
                    description: `${target.id} remains visible; the chain is in Audit and Lineage.`,
                  });
                  setTarget(null);
                }
              }}
            >
              Append reversal and replacement
            </PermissionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------------- Receipts ------------------------------- */

export function ImportReceiptTable({ onOpen }: { onOpen: (receipt: IntakeReceiptView) => void }) {
  const { receipts } = useDemoState();
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead>Receipt ID</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Data type</TableHead>
            <TableHead>Started by</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Accepted</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead>Rejected</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-navy">{r.id}</TableCell>
              <TableCell>{r.source}</TableCell>
              <TableCell>{r.dataType}</TableCell>
              <TableCell>{r.startedBy}</TableCell>
              <TableCell className="tnum">{r.startedAt}</TableCell>
              <TableCell className="tnum">{r.accepted}</TableCell>
              <TableCell className="tnum">{r.warnings}</TableCell>
              <TableCell className="tnum">{r.rejected}</TableCell>
              <TableCell>
                <StatusBadge
                  label={r.status}
                  tone={
                    r.status === "Completed"
                      ? "success"
                      : r.status === "Completed with warnings"
                        ? "warning"
                        : "danger"
                  }
                />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onOpen(r)}>
                  View receipt
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ImportReceiptDrawer({
  receipt,
  onClose,
}: {
  receipt: IntakeReceiptView | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!receipt} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {receipt && (
          <>
            <SheetHeader>
              <SheetTitle className="text-navy">Import receipt {receipt.id}</SheetTitle>
              <SheetDescription>
                {receipt.dataType} from {receipt.source}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-10">
              <KeyValue
                items={[
                  { label: "Started by", value: receipt.startedBy },
                  { label: "Started", value: receipt.startedAt },
                  { label: "Reason", value: receipt.reason },
                  { label: "Trace ID", value: receipt.traceId },
                  {
                    label: "Counts",
                    value: `${receipt.accepted} accepted · ${receipt.warnings} warnings · ${receipt.rejected} rejected · ${receipt.noChange} unchanged`,
                  },
                  {
                    label: "Warnings acknowledged",
                    value: receipt.acknowledgedWarnings ? "Yes" : "No",
                  },
                ]}
              />
              <div>
                <h4 className="text-sm font-semibold text-navy">Column mapping</h4>
                <div className="mt-2 overflow-x-auto">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source column</TableHead>
                        <TableHead>Expected field</TableHead>
                        <TableHead>Required</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipt.mapping.map((m) => (
                        <TableRow key={m.sourceColumn}>
                          <TableCell>{m.sourceColumn}</TableCell>
                          <TableCell className="font-mono text-xs">{m.expectedField}</TableCell>
                          <TableCell>{m.required ? "Required" : "Optional"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-navy">Validation results</h4>
                {receipt.issues.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No validation issues were raised in this run.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {receipt.issues.map((i) => (
                      <li key={`${i.row}-${i.field}`} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={i.severity === "rejected" ? "Rejected" : "Warning"}
                            tone={i.severity === "rejected" ? "danger" : "warning"}
                            icon={
                              i.severity === "rejected" ? (
                                <ShieldAlert className="size-3.5" aria-hidden />
                              ) : (
                                <TriangleAlert className="size-3.5" aria-hidden />
                              )
                            }
                          />
                          <span className="tnum text-xs text-muted-foreground">
                            Row {i.row} · {i.field} · value “{i.value || "empty"}”
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-navy">{i.problem}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Suggested correction: {i.suggestion}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-navy">Related object references</h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {receipt.objectRefs.map((ref) => (
                    <li
                      key={ref}
                      className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px]"
                    >
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/audit">Open Audit and Lineage</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function AcknowledgeWarnings({
  checked,
  onChange,
  count,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  count: number;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span>
        I acknowledge the {count} warning row{count === 1 ? "" : "s"} and confirm they should still be
        accepted.
      </span>
    </label>
  );
}
