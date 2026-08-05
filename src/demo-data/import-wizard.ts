import type { ImportDatasetDef, ImportRowView } from "./intake";

export const wizardSteps = [
  { key: "source", label: "Source and reason" },
  { key: "sample", label: "Load sample" },
  { key: "mapping", label: "Column mapping" },
  { key: "validation", label: "Validation" },
  { key: "commit", label: "Commit and receipt" },
] as const;

export const lastStep = wizardSteps.length - 1;

export interface WizardDraft {
  importType: string;
  reason: string;
  loaded: boolean;
  mappingConfirmed: boolean;
  acknowledged: boolean;
  excludedRows: number[];
  committedReceiptId: string | null;
  updatedAt: string;
}

export function emptyDraft(importType: string): WizardDraft {
  return {
    importType,
    reason: "",
    loaded: false,
    mappingConfirmed: false,
    acknowledged: false,
    excludedRows: [],
    committedReceiptId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function clampStep(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(lastStep, Math.max(0, Math.trunc(n)));
}

/** Rows that will actually be committed given the user's exclusions. */
export function stagedRows(dataset: ImportDatasetDef, draft: WizardDraft): ImportRowView[] {
  return dataset.rows.filter((r) => !draft.excludedRows.includes(r.row));
}

export function warningRows(dataset: ImportDatasetDef, draft: WizardDraft) {
  return stagedRows(dataset, draft).filter((r) => r.outcome === "Warning");
}

/**
 * Per-step completion. A step is only reachable when every earlier step is
 * complete, which is what keeps back/next and deep links honest.
 */
export function stepIssues(
  dataset: ImportDatasetDef,
  draft: WizardDraft,
  step: number,
): string[] {
  const issues: string[] = [];
  if (step === 0) {
    if (draft.reason.trim().length < 8) issues.push("Give a reason of at least eight characters.");
  }
  if (step === 1) {
    if (!draft.loaded) issues.push("Load the synthetic sample to stage rows.");
  }
  if (step === 2) {
    if (!draft.mappingConfirmed) issues.push("Confirm the column mapping before continuing.");
    const missing = dataset.columns.filter((c) => c.required && !c.sampleValue.trim());
    if (missing.length > 0)
      issues.push(`Required fields without a sample value: ${missing.map((c) => c.expectedField).join(", ")}.`);
  }
  if (step === 3) {
    if (stagedRows(dataset, draft).length === 0) issues.push("At least one row must remain staged.");
    if (warningRows(dataset, draft).length > 0 && !draft.acknowledged)
      issues.push("Acknowledge the warning rows or exclude them.");
  }
  return issues;
}

export function isStepComplete(dataset: ImportDatasetDef, draft: WizardDraft, step: number) {
  return stepIssues(dataset, draft, step).length === 0;
}

/** Highest step the user is allowed to be on right now. */
export function furthestReachableStep(dataset: ImportDatasetDef, draft: WizardDraft) {
  let reachable = 0;
  for (let s = 0; s < lastStep; s += 1) {
    if (!isStepComplete(dataset, draft, s)) return reachable;
    reachable = s + 1;
  }
  return reachable;
}

/* ------------------------- session persistence ---------------------------- */

const storageKey = (importType: string) => `bdms.import-wizard.${importType}`;

export function loadDraft(importType: string): WizardDraft {
  if (typeof window === "undefined") return emptyDraft(importType);
  try {
    const raw = window.sessionStorage.getItem(storageKey(importType));
    if (!raw) return emptyDraft(importType);
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    return {
      ...emptyDraft(importType),
      ...parsed,
      importType,
      excludedRows: Array.isArray(parsed.excludedRows) ? parsed.excludedRows.map(Number) : [],
    };
  } catch {
    return emptyDraft(importType);
  }
}

export function saveDraft(draft: WizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      storageKey(draft.importType),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* session storage unavailable - the wizard still works in-memory */
  }
}

export function clearDraft(importType: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey(importType));
  } catch {
    /* ignore */
  }
}

export function draftIsStarted(draft: WizardDraft) {
  return (
    draft.reason.trim().length > 0 ||
    draft.loaded ||
    draft.mappingConfirmed ||
    draft.acknowledged ||
    draft.excludedRows.length > 0 ||
    draft.committedReceiptId !== null
  );
}
