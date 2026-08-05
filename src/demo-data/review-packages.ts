// Concept-only presentation model for the Sprint 3 Excel review round trip.
// No real workbook is generated or parsed. Synthetic data only.

export type ImportValidationState =
  | "Not started"
  | "Awaiting reviewer return"
  | "Blocked - stale workbook"
  | "Validated"
  | "Blocked - invalid rows";

export type PackageState =
  | "Draft - awaiting citation validation"
  | "Exported - awaiting reviewer return"
  | "Returned - blocked"
  | "Validated - awaiting reviewer approval"
  | "Approved";

export interface ImportValidationRow {
  row: number;
  outcome:
    | "Stale workbook version"
    | "Duplicate import"
    | "Modified protected identifier"
    | "Invalid or unknown standard ID"
    | "Blank mandatory reviewer decision"
    | "Unrecognised decision value"
    | "Valid edited mapping"
    | "Valid NO_MATCH decision";
  field: string;
  value: string;
  explanation: string;
  blocked: boolean;
}

export interface ReviewPackageView {
  id: string;
  version: string;
  sopRef: string;
  moduleCode: string;
  runId: string;
  model: string;
  promptHash: string;
  manifestChecksum: string;
  exportedBy: string;
  exportedAt: string;
  reviewer: string;
  due: string;
  returnedWorkbook: string;
  importState: ImportValidationState;
  invalidCitations: number;
  changedRows: number;
  state: PackageState;
  auditRef: string;
  validation: ImportValidationRow[];
}

export const workflowSteps = [
  "Agent draft",
  "Citation validation",
  "Export manifest",
  "Reviewer workbook",
  "Import validation",
  "Approved mapping",
  "Immutable audit event",
];

export const seedReviewPackages: ReviewPackageView[] = [
  {
    id: "RVP-0001",
    version: "v1",
    sopRef: "SOP-ICU-014 (synthetic)",
    moduleCode: "M03",
    runId: "run-8f21c4 (simulated)",
    model: "Placeholder mapping model",
    promptHash: "ph-4c19ab (simulated)",
    manifestChecksum: "sha256:<placeholder>",
    exportedBy: "Not exported",
    exportedAt: "-",
    reviewer: "Unassigned",
    due: "-",
    returnedWorkbook: "-",
    importState: "Not started",
    invalidCitations: 3,
    changedRows: 0,
    state: "Draft - awaiting citation validation",
    auditRef: "Pending",
    validation: [
      {
        row: 4,
        outcome: "Invalid or unknown standard ID",
        field: "standard_id",
        value: "PLACEHOLDER.99.9",
        explanation: "Identifier is not in the approved whitelist. Export is blocked until corrected.",
        blocked: true,
      },
    ],
  },
  {
    id: "RVP-0002",
    version: "v2",
    sopRef: "SOP-IPC-007 (synthetic)",
    moduleCode: "M11",
    runId: "run-b7d420 (simulated)",
    model: "Placeholder mapping model",
    promptHash: "ph-91be07 (simulated)",
    manifestChecksum: "sha256:<placeholder>",
    exportedBy: "Nadia Rahman",
    exportedAt: "1 Aug 2026, 11:40",
    reviewer: "Dr Farhana Kabir",
    due: "8 Aug 2026",
    returnedWorkbook: "Not returned",
    importState: "Awaiting reviewer return",
    invalidCitations: 0,
    changedRows: 0,
    state: "Exported - awaiting reviewer return",
    auditRef: "AUDREF-408112 (simulated)",
    validation: [],
  },
  {
    id: "RVP-0003",
    version: "v1",
    sopRef: "SOP-ICU-021 (synthetic)",
    moduleCode: "M03",
    runId: "run-2a90ff (simulated)",
    model: "Placeholder mapping model",
    promptHash: "ph-77aa31 (simulated)",
    manifestChecksum: "sha256:<placeholder>",
    exportedBy: "Nadia Rahman",
    exportedAt: "22 Jul 2026, 09:15",
    reviewer: "Dr Farhana Kabir",
    due: "29 Jul 2026",
    returnedWorkbook: "RVP-0003-return-v1.xlsx (reference only)",
    importState: "Blocked - stale workbook",
    invalidCitations: 2,
    changedRows: 11,
    state: "Returned - blocked",
    auditRef: "AUDREF-408130 (simulated)",
    validation: [
      {
        row: 1,
        outcome: "Stale workbook version",
        field: "workbook_version",
        value: "v1 returned against export v2",
        explanation: "The source mapping run changed after export. The whole workbook is rejected.",
        blocked: true,
      },
      {
        row: 1,
        outcome: "Duplicate import",
        field: "import_id",
        value: "imp-5510 (already processed)",
        explanation: "This workbook reference was imported before. Repeat imports are refused.",
        blocked: true,
      },
      {
        row: 7,
        outcome: "Modified protected identifier",
        field: "clause_id",
        value: "CL-0007 changed to CL-0007b",
        explanation: "Protected identifier columns are read-only for reviewers.",
        blocked: true,
      },
      {
        row: 12,
        outcome: "Blank mandatory reviewer decision",
        field: "reviewer_decision",
        value: "(blank)",
        explanation: "A decision is mandatory for every exported row.",
        blocked: true,
      },
    ],
  },
  {
    id: "RVP-0004",
    version: "v3",
    sopRef: "SOP-IPC-012 (synthetic)",
    moduleCode: "M11",
    runId: "run-c31d55 (simulated)",
    model: "Placeholder mapping model",
    promptHash: "ph-2fd018 (simulated)",
    manifestChecksum: "sha256:<placeholder>",
    exportedBy: "Nadia Rahman",
    exportedAt: "28 Jul 2026, 16:05",
    reviewer: "Dr Farhana Kabir",
    due: "4 Aug 2026",
    returnedWorkbook: "RVP-0004-return-v3.xlsx (reference only)",
    importState: "Validated",
    invalidCitations: 0,
    changedRows: 9,
    state: "Validated - awaiting reviewer approval",
    auditRef: "AUDREF-408171 (simulated)",
    validation: [
      {
        row: 3,
        outcome: "Valid edited mapping",
        field: "standard_id",
        value: "PLACEHOLDER.09.2",
        explanation: "Reviewer edit accepted: identifier is in the approved whitelist.",
        blocked: false,
      },
      {
        row: 5,
        outcome: "Valid NO_MATCH decision",
        field: "reviewer_decision",
        value: "NO_MATCH",
        explanation: "Recorded as a deliberate no-match with reviewer identity and reason.",
        blocked: false,
      },
      {
        row: 8,
        outcome: "Unrecognised decision value",
        field: "reviewer_decision",
        value: "MAYBE",
        explanation: "Decision vocabulary is fixed. This row is held, never auto-approved.",
        blocked: true,
      },
    ],
  },
];

export const goldSetGate = {
  requiredSops: 20,
  availableSops: 0,
  reviewers: "Pending (OD-C)",
  precisionTarget: ">= 80%",
  precisionResult: "Not run",
  recallMeasure: "Defined but not run",
  overall: "Blocked - gold set and reviewers required",
};

export function packageTone(state: PackageState) {
  switch (state) {
    case "Approved":
      return "success" as const;
    case "Validated - awaiting reviewer approval":
      return "info" as const;
    case "Exported - awaiting reviewer return":
    case "Draft - awaiting citation validation":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}