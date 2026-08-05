// Concept-only presentation state. Replace through adapters when the
// owner-approved PostgreSQL services become available.
import type {
  DataSourceStatusView,
  IntakeRecordKind,
  IntakeReceiptView,
  LedgerEntryView,
  ProgrammeRecordDraft,
  RegistryChangeProposalView,
  ValidationIssueView,
} from "./types";

export const SYNTHETIC_WARNING =
  "Use synthetic demonstration data only. Do not upload real patient, employee, programme-confidential, or licensed standards content.";

/* ---------------------------- Source catalogue ---------------------------- */

export const dataSources: DataSourceStatusView[] = [
  {
    id: "module-registry",
    name: "Module Registry",
    authoritativeSource: "Official unified registry governed by SCH-001",
    owner: "Product Owner / PMO",
    intakeMethod: "Owner-approved reference-data load",
    productionPath: "Approved reference-data or migration procedure",
    lastLoad: "1 Aug 2026, 08:40",
    accepted: 30,
    warnings: 0,
    rejected: 0,
    health: "Healthy",
    description:
      "The governed 30-module registry. Modules cannot be added directly; every change runs through a proposal with owner approval.",
    expectedFields: ["module_code", "module_name", "estate", "prd_crosswalk", "effective_date"],
    validationRules: [
      "Module code must match M## and be unique",
      "Estate is required",
      "Authoritative source-document reference is required",
      "Registry change requires owner approval before it affects counts",
    ],
    receiptIds: [],
    importType: "registry",
  },
  {
    id: "schedule",
    name: "Schedule and Work Packages",
    authoritativeSource: "SCH-001",
    owner: "PMO",
    intakeMethod: "Initial import, then controlled Microsoft 365 update and sync",
    productionPath: "Validated synchronisation into the approved PostgreSQL database",
    lastLoad: "4 Aug 2026, 17:05",
    accepted: 42,
    warnings: 3,
    rejected: 2,
    health: "Attention",
    description:
      "Milestones, dependencies, missions and work-package progress derived from the SCH-001 baseline.",
    expectedFields: ["wp_id", "module_code", "owner", "baseline_date", "forecast_date", "progress"],
    validationRules: [
      "Unknown module codes are rejected",
      "Milestone cannot be earlier than its dependency",
      "Frozen baseline BL0 cannot be altered by import",
      "Progress must be between 0 and 100",
    ],
    receiptIds: ["IMP-DEMO-0042"],
    importType: "schedule",
  },
  {
    id: "risks",
    name: "Risks, Decisions and Obligations",
    authoritativeSource: "Risk register, decision log and counterpart obligation register",
    owner: "Risk Owner / Product Owner / PMO",
    intakeMethod: "Controlled Microsoft 365 entry and sync",
    productionPath: "Validated synchronisation into the approved PostgreSQL database",
    lastLoad: "5 Aug 2026, 07:52",
    accepted: 61,
    warnings: 2,
    rejected: 0,
    health: "Healthy",
    description:
      "Governance records that drive the calculated module RAG. Users record facts; the rules calculate status.",
    expectedFields: ["title", "module_code", "owner", "likelihood", "impact", "target_date"],
    validationRules: [
      "Owner is required",
      "Target date must be a valid date",
      "Risk score is calculated, never entered",
      "RAG status cannot be selected manually",
    ],
    receiptIds: [],
    importType: "risks",
  },
  {
    id: "deliverables",
    name: "Deliverables and Evidence",
    authoritativeSource: "Deliverables register and approved document library",
    owner: "Module Lead / Document Owner",
    intakeMethod: "Document registration and metadata sync",
    productionPath: "Controlled document registration with metadata synchronisation",
    lastLoad: "4 Aug 2026, 12:20",
    accepted: 88,
    warnings: 6,
    rejected: 1,
    health: "Attention",
    description:
      "L0-L3 deliverable structure and the evidence metadata used by gap analysis. Only metadata is stored in this mockup.",
    expectedFields: ["deliverable_id", "level", "parent_id", "module_code", "owner", "due_date"],
    validationRules: [
      "L1 to L3 deliverables require a parent",
      "Document version and effective date are required",
      "Placeholder standard IDs must be on the demo whitelist",
      "No real file content is stored or transmitted",
    ],
    receiptIds: [],
    importType: "deliverables",
  },
  {
    id: "mandays",
    name: "Man-day Ledger",
    authoritativeSource: "Approved effort records",
    owner: "Authorised Human / PMO",
    intakeMethod: "Controlled import or sync",
    productionPath: "Validated effort import with append-only journaling",
    lastLoad: "3 Aug 2026, 16:10",
    accepted: 214,
    warnings: 1,
    rejected: 3,
    health: "Healthy",
    description:
      "Append-only effort ledger. Accepted entries are never overwritten; corrections use a reversal plus a replacement entry.",
    expectedFields: ["entry_date", "consultant", "module_code", "work_package", "days"],
    validationRules: [
      "Days must be greater than zero",
      "Entry date must be a valid date",
      "Accepted entries cannot be edited or deleted",
      "Corrections require reversal and replacement",
    ],
    receiptIds: [],
    importType: "mandays",
  },
  {
    id: "jci",
    name: "JCI Knowledge Corpus",
    authoritativeSource: "Owner-provided corpus and valid_ids.txt",
    owner: "Product Owner",
    intakeMethod: "Validated knowledge-corpus ingestion",
    productionPath: "Controlled corpus load with whitelist verification",
    lastLoad: "28 Jul 2026, 09:00",
    accepted: 0,
    warnings: 0,
    rejected: 0,
    health: "Attention",
    description:
      "Placeholder standards only. Users must not create official JCI standards manually; the corpus is loaded through a controlled whitelist process.",
    expectedFields: ["standard_id", "chapter", "classification", "paraphrase"],
    validationRules: [
      "Standard IDs must appear in valid_ids.txt",
      "No licensed JCI text may be entered by hand",
      "Paraphrases are marked placeholder until the corpus is loaded",
    ],
    receiptIds: [],
  },
  {
    id: "dghs",
    name: "DGHS Regulatory Overlay",
    authoritativeSource: "Approved sources, still to be defined",
    owner: "Product Owner / Regulatory Reviewer",
    intakeMethod: "Controlled regulatory-corpus ingestion",
    productionPath: "To be defined with the regulatory reviewer",
    lastLoad: "Not loaded",
    accepted: 0,
    warnings: 0,
    rejected: 0,
    health: "Source definition required",
    description:
      "The authoritative DGHS source set has not been agreed. Nothing is ingested and no requirement claims may be made from this source yet.",
    expectedFields: ["requirement_id", "instrument", "clause", "effective_date"],
    validationRules: ["Source definition required before any ingestion is permitted"],
    receiptIds: [],
  },
  {
    id: "sop",
    name: "SOP and Baseline Documents",
    authoritativeSource: "Approved document library or controlled local intake",
    owner: "Document Owner",
    intakeMethod: "Document registration and metadata sync",
    productionPath: "Controlled document library with version control",
    lastLoad: "4 Aug 2026, 15:44",
    accepted: 37,
    warnings: 2,
    rejected: 0,
    health: "Healthy",
    description:
      "Source documents that AI mapping and gap analysis read. Registration stores synthetic metadata only.",
    expectedFields: ["document_title", "document_type", "version", "effective_date", "classification"],
    validationRules: [
      "Version and effective date are required",
      "Classification is required",
      "File contents stay in the browser in this mockup",
    ],
    receiptIds: [],
    importType: "evidence",
  },
  {
    id: "agent",
    name: "AI Draft Outputs",
    authoritativeSource: "Local agent run",
    owner: "System Agent",
    intakeMethod: "DRAFT record in agent_output",
    productionPath: "Draft records reviewed by an identified human before use",
    lastLoad: "5 Aug 2026, 06:31",
    accepted: 24,
    warnings: 5,
    rejected: 2,
    health: "Attention",
    description:
      "Mappings and gap analyses produced by the local agent. They remain DRAFT until a named human reviews them.",
    expectedFields: ["run_id", "model", "prompt_hash", "clause_ref", "confidence"],
    validationRules: [
      "Drafts cannot change programme status",
      "Citations must resolve to whitelisted placeholder standards",
      "Every draft records model and prompt hash",
    ],
    receiptIds: [],
  },
  {
    id: "reviews",
    name: "Human Review Decisions",
    authoritativeSource: "Structured review action by a named human reviewer",
    owner: "Named Human Reviewer",
    intakeMethod: "Validated review import or authenticated review action",
    productionPath: "Authenticated review action journaled automatically",
    lastLoad: "5 Aug 2026, 08:15",
    accepted: 19,
    warnings: 0,
    rejected: 1,
    health: "Healthy",
    description:
      "Approve, edit and reject outcomes recorded against AI drafts. Every outcome is journaled to Audit and Lineage.",
    expectedFields: ["review_id", "reviewer", "outcome", "reason", "decided_at"],
    validationRules: [
      "Reviewer identity is required",
      "Rejections require a reason",
      "Decisions are append-only",
    ],
    receiptIds: [],
  },
];

export function dataSourceById(id: string) {
  return dataSources.find((s) => s.id === id);
}

/* ------------------------------ Quick-add forms ---------------------------- */

export interface IntakeFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select";
  required: boolean;
  options?: string[];
  help?: string;
}

export interface IntakeFormDef {
  kind: IntakeRecordKind;
  label: string;
  purpose: string;
  permissionNote: string;
  fields: IntakeFieldDef[];
  example: Record<string, string>;
}

const LIKELIHOOD = ["1 - Rare", "2 - Unlikely", "3 - Possible", "4 - Likely", "5 - Almost certain"];
const IMPACT = ["1 - Negligible", "2 - Minor", "3 - Moderate", "4 - Major", "5 - Severe"];

export const intakeForms: IntakeFormDef[] = [
  {
    kind: "risk",
    label: "Add risk",
    purpose: "Record a programme risk so the rules can recalculate the module's status.",
    permissionNote: "Module Leads may add risks for their assigned modules.",
    fields: [
      { key: "title", label: "Risk title", type: "text", required: true },
      { key: "moduleCode", label: "Module", type: "select", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "cause", label: "Cause", type: "textarea", required: false },
      { key: "impactText", label: "Potential impact", type: "textarea", required: true },
      { key: "likelihood", label: "Likelihood", type: "select", required: true, options: LIKELIHOOD },
      { key: "impactRating", label: "Impact rating", type: "select", required: true, options: IMPACT },
      { key: "owner", label: "Risk owner", type: "text", required: true },
      { key: "mitigation", label: "Mitigation", type: "textarea", required: false },
      { key: "effectiveDate", label: "Target date", type: "date", required: true },
      { key: "source", label: "Source / reference", type: "text", required: true },
      { key: "reason", label: "Reason or rationale", type: "textarea", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      title: "ICU ventilator commissioning slips past clinical dry-run",
      moduleCode: "M03",
      description:
        "Biomedical acceptance testing for 12 ICU ventilators is tracking two weeks behind the dry-run window.",
      cause: "Vendor engineer availability was confirmed later than the baseline assumed.",
      impactText: "Clinical dry-run cannot be evidenced before Programme Gate 1.",
      likelihood: "4 - Likely",
      impactRating: "4 - Major",
      owner: "Dr. Arif Hasan",
      mitigation: "Book a second acceptance-testing window and pre-stage calibration records.",
      effectiveDate: "2026-09-04",
      source: "SCH-001 WP-M03-04 status note",
      reason: "Raised after the weekly ICU readiness review.",
      classification: "Internal",
    },
  },
  {
    kind: "decision",
    label: "Add decision",
    purpose: "Register a decision that an owner must make, with the options considered.",
    permissionNote: "PMO records decisions on behalf of the decision owner.",
    fields: [
      { key: "title", label: "Decision title", type: "text", required: true },
      { key: "decisionRequired", label: "Decision required", type: "textarea", required: true },
      { key: "context", label: "Context", type: "textarea", required: true },
      { key: "options", label: "Options considered", type: "textarea", required: true },
      { key: "recommended", label: "Recommended option", type: "text", required: true },
      { key: "owner", label: "Decision owner", type: "text", required: true },
      { key: "effectiveDate", label: "Decision due date", type: "date", required: true },
      { key: "moduleCode", label: "Related module", type: "select", required: true },
      { key: "source", label: "Evidence / reference", type: "text", required: true },
      { key: "reason", label: "Rationale", type: "textarea", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      title: "Confirm ICU isolation room ventilation standard",
      decisionRequired: "Approve the ventilation specification to be evidenced at Gate 1.",
      context: "Two specifications are in circulation between the design pack and the SOP draft.",
      options: "A: retain design-pack specification. B: adopt the SOP draft specification.",
      recommended: "Option B, subject to infection-prevention sign-off",
      owner: "Nabila Chowdhury",
      effectiveDate: "2026-08-21",
      moduleCode: "M03",
      source: "SOP-ICU-014 draft v0.3",
      reason: "Blocking evidence registration for two ICU requirements.",
      classification: "Programme confidential",
    },
  },
  {
    kind: "obligation",
    label: "Add obligation",
    purpose: "Track a commitment owed by or to a counterpart organisation.",
    permissionNote: "PMO maintains the counterpart obligation register.",
    fields: [
      { key: "title", label: "Obligation title", type: "text", required: true },
      { key: "counterpart", label: "Counterpart", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "owner", label: "Responsible owner", type: "text", required: true },
      { key: "effectiveDate", label: "Due date", type: "date", required: true },
      { key: "moduleCode", label: "Related module", type: "select", required: true },
      { key: "evidenceRequired", label: "Evidence required", type: "textarea", required: true },
      { key: "source", label: "Source / reference", type: "text", required: true },
      { key: "reason", label: "Reason or rationale", type: "textarea", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      title: "Counterpart to supply ICU biomedical calibration certificates",
      counterpart: "Estate Facilities Contractor",
      description: "Calibration certificates for ICU monitors are due before the clinical dry-run.",
      owner: "Omar Siddiqui",
      effectiveDate: "2026-08-28",
      moduleCode: "M03",
      evidenceRequired: "Signed calibration certificates for each serial number",
      source: "Counterpart obligation register row 118",
      reason: "Gate 1 evidence pack depends on these certificates.",
      classification: "Internal",
    },
  },
  {
    kind: "deliverable",
    label: "Register deliverable",
    purpose: "Add a deliverable to the register with its level and parent.",
    permissionNote: "Module Leads register deliverables for their modules.",
    fields: [
      { key: "deliverableId", label: "Deliverable ID", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "level", label: "Level", type: "select", required: true, options: ["L0", "L1", "L2", "L3"] },
      { key: "parent", label: "Parent deliverable", type: "text", required: false, help: "Required for L1 to L3." },
      { key: "moduleCode", label: "Module", type: "select", required: true },
      { key: "owner", label: "Owner", type: "text", required: true },
      { key: "approver", label: "Approving authority", type: "text", required: true },
      { key: "effectiveDate", label: "Due date", type: "date", required: true },
      { key: "standards", label: "Related placeholder standards", type: "text", required: false },
      { key: "source", label: "Source / reference", type: "text", required: true },
      { key: "reason", label: "Reason or rationale", type: "textarea", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      deliverableId: "DL-M03-07",
      title: "ICU clinical dry-run report",
      level: "L2",
      parent: "DL-M03-02",
      moduleCode: "M03",
      owner: "Dr. Arif Hasan",
      approver: "Programme Owner / PMO Lead",
      effectiveDate: "2026-09-18",
      standards: "PLACEHOLDER-ICU-002",
      source: "SCH-001 deliverable breakdown",
      reason: "Gate 1 requires an evidenced clinical dry-run.",
      classification: "Internal",
    },
  },
  {
    kind: "evidence",
    label: "Register evidence document",
    purpose: "Register document metadata so gap analysis can reference it. No file is stored.",
    permissionNote: "Document Owners register evidence metadata.",
    fields: [
      { key: "title", label: "Document title", type: "text", required: true },
      { key: "docType", label: "Document type", type: "select", required: true, options: ["SOP", "Report", "Certificate", "Register", "Plan"] },
      { key: "moduleCode", label: "Module", type: "select", required: true },
      { key: "owner", label: "Owner", type: "text", required: true },
      { key: "version", label: "Version", type: "text", required: true },
      { key: "effectiveDate", label: "Effective date", type: "date", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
      { key: "source", label: "Controlled source / reference", type: "text", required: true },
      { key: "relatedDeliverable", label: "Related deliverable", type: "text", required: false },
      { key: "standards", label: "Related placeholder standards", type: "text", required: false },
      { key: "reason", label: "Reason or rationale", type: "textarea", required: true },
    ],
    example: {
      title: "ICU equipment readiness checklist",
      docType: "Report",
      moduleCode: "M03",
      owner: "Dr. Arif Hasan",
      version: "v0.4",
      effectiveDate: "2026-08-14",
      classification: "Internal",
      source: "Controlled document library ref DOC-ICU-221",
      relatedDeliverable: "DL-M03-02",
      standards: "PLACEHOLDER-ICU-001",
      reason: "Closes a missing-evidence finding raised by ICU gap analysis.",
    },
  },
  {
    kind: "workpackage",
    label: "Add work-package update",
    purpose: "Record progress against a work package. RAG remains rule-calculated.",
    permissionNote: "Module Leads update their own work packages.",
    fields: [
      { key: "workPackageId", label: "Work-package ID", type: "text", required: true },
      { key: "moduleCode", label: "Module", type: "select", required: true },
      { key: "progress", label: "Progress percentage", type: "number", required: true },
      { key: "state", label: "State", type: "select", required: true, options: ["Not started", "In progress", "Overdue", "Complete"] },
      { key: "effectiveDate", label: "Forecast date", type: "date", required: true },
      { key: "blocker", label: "Blocker", type: "textarea", required: false },
      { key: "reason", label: "Update note", type: "textarea", required: true },
      { key: "owner", label: "Updated by", type: "text", required: true },
      { key: "source", label: "Source / reference", type: "text", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      workPackageId: "WP-M03-04",
      moduleCode: "M03",
      progress: "62",
      state: "In progress",
      effectiveDate: "2026-09-11",
      blocker: "Second vendor engineer window not yet confirmed.",
      reason: "Acceptance testing resumed after calibration records were located.",
      owner: "Dr. Arif Hasan",
      source: "Weekly ICU readiness review",
      classification: "Internal",
    },
  },
  {
    kind: "manday",
    label: "Add man-day entry",
    purpose: "Append an effort record. Accepted entries cannot be overwritten.",
    permissionNote: "PMO records effort for the approved ledger.",
    fields: [
      { key: "effectiveDate", label: "Entry date", type: "date", required: true },
      { key: "consultant", label: "Consultant (fictional)", type: "text", required: true },
      { key: "moduleCode", label: "Module", type: "select", required: true },
      { key: "workPackage", label: "Work package", type: "text", required: true },
      { key: "days", label: "Days", type: "number", required: true, help: "Must be greater than zero." },
      { key: "title", label: "Activity description", type: "text", required: true },
      { key: "source", label: "Source / reference", type: "text", required: true },
      { key: "reason", label: "Reason or rationale", type: "textarea", required: true },
      { key: "classification", label: "Classification", type: "select", required: true, options: ["Internal", "Programme confidential", "Public"] },
    ],
    example: {
      effectiveDate: "2026-08-03",
      consultant: "Dr. Arif Hasan",
      moduleCode: "M03",
      workPackage: "WP-M03-04",
      days: "1.5",
      title: "ICU ventilator acceptance-test supervision",
      source: "Approved effort record sheet EF-2026-31",
      reason: "Effort recorded for the ICU acceptance-testing window.",
      classification: "Internal",
    },
  },
];

export function formFor(kind: IntakeRecordKind) {
  return intakeForms.find((f) => f.kind === kind)!;
}

export const recordKindLabels: Record<IntakeRecordKind, string> = {
  risk: "Risk",
  decision: "Decision",
  obligation: "Obligation",
  deliverable: "Deliverable",
  evidence: "Evidence document",
  workpackage: "Work-package update",
  manday: "Man-day entry",
};

/** Pure field validation shared by the quick-add forms. */
export function validateRecord(
  kind: IntakeRecordKind,
  values: Record<string, string>,
): Record<string, string> {
  const def = formFor(kind);
  const errors: Record<string, string> = {};
  for (const field of def.fields) {
    if (field.required && !(values[field.key] ?? "").trim()) {
      errors[field.key] = `${field.label} is required.`;
    }
  }
  if (kind === "manday") {
    const days = Number(values["days"]);
    if (!Number.isFinite(days) || days <= 0) errors["days"] = "Days must be greater than zero.";
  }
  if (kind === "deliverable" && values["level"] && values["level"] !== "L0" && !(values["parent"] ?? "").trim()) {
    errors["parent"] = "L1 to L3 deliverables require a parent deliverable.";
  }
  if (kind === "workpackage") {
    const p = Number(values["progress"]);
    if (!Number.isFinite(p) || p < 0 || p > 100) errors["progress"] = "Progress must be between 0 and 100.";
  }
  return errors;
}

/* ------------------------------ Import wizard ------------------------------ */

export interface ImportRowView {
  row: number;
  reference: string;
  summary: string;
  outcome: "Accepted" | "Warning" | "Rejected" | "No change";
  issue?: ValidationIssueView;
}

export interface ImportDatasetDef {
  importType: string;
  label: string;
  sampleName: string;
  columns: { sourceColumn: string; sampleValue: string; expectedField: string; required: boolean }[];
  rows: ImportRowView[];
}

function issue(
  row: number,
  field: string,
  value: string,
  problem: string,
  suggestion: string,
  severity: "warning" | "rejected",
): ValidationIssueView {
  return { row, field, value, problem, suggestion, severity };
}

export const importDatasets: ImportDatasetDef[] = [
  {
    importType: "schedule",
    label: "Schedule and work packages",
    sampleName: "SCH-001 schedule sample (synthetic)",
    columns: [
      { sourceColumn: "WP Code", sampleValue: "WP-M03-04", expectedField: "wp_id", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
      { sourceColumn: "Package Name", sampleValue: "Ventilator acceptance testing", expectedField: "wp_name", required: true },
      { sourceColumn: "Resp.", sampleValue: "Dr. Arif Hasan", expectedField: "owner", required: true },
      { sourceColumn: "Baseline", sampleValue: "2026-08-22", expectedField: "baseline_date", required: true },
      { sourceColumn: "Forecast", sampleValue: "2026-09-11", expectedField: "forecast_date", required: false },
      { sourceColumn: "Pct", sampleValue: "62", expectedField: "progress", required: false },
    ],
    rows: [
      { row: 1, reference: "WP-M03-04", summary: "Ventilator acceptance testing, 62% complete", outcome: "Accepted" },
      { row: 2, reference: "WP-M03-05", summary: "Clinical dry-run preparation", outcome: "Accepted" },
      { row: 3, reference: "WP-M17-02", summary: "Fire damper survey", outcome: "Accepted" },
      { row: 4, reference: "WP-M03-06", summary: "Isolation-room commissioning", outcome: "No change" },
      {
        row: 5,
        reference: "WP-M12-01",
        summary: "Clinical systems interface test",
        outcome: "Warning",
        issue: issue(5, "owner", "", "Owner missing", "Assign the module lead as interim owner", "warning"),
      },
      {
        row: 6,
        reference: "WP-M14-03",
        summary: "Sterile stores fit-out",
        outcome: "Warning",
        issue: issue(6, "forecast_date", "2026-13-04", "Invalid date", "Use ISO format YYYY-MM-DD", "warning"),
      },
      {
        row: 7,
        reference: "WP-M27-02",
        summary: "Access-control commissioning",
        outcome: "Warning",
        issue: issue(7, "baseline_date", "2026-07-30", "Milestone earlier than its dependency", "Move after WP-M27-01 forecast finish", "warning"),
      },
      {
        row: 8,
        reference: "WP-M99-01",
        summary: "Unknown module reference",
        outcome: "Rejected",
        issue: issue(8, "module_code", "M99", "Unknown module code", "Use a code from the governed registry or raise a registry proposal", "rejected"),
      },
      {
        row: 9,
        reference: "BL0-MS-002",
        summary: "Attempt to move a frozen baseline milestone",
        outcome: "Rejected",
        issue: issue(9, "baseline_date", "BL0", "Attempt to alter frozen baseline BL0", "Raise a baseline change request instead", "rejected"),
      },
    ],
  },
  {
    importType: "risks",
    label: "Risks",
    sampleName: "Risk register sample (synthetic)",
    columns: [
      { sourceColumn: "Risk Ref", sampleValue: "R-M03-11", expectedField: "risk_id", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
      { sourceColumn: "Title", sampleValue: "Calibration records incomplete", expectedField: "title", required: true },
      { sourceColumn: "Owner", sampleValue: "Dr. Arif Hasan", expectedField: "owner", required: true },
      { sourceColumn: "Likelihood", sampleValue: "4", expectedField: "likelihood", required: true },
      { sourceColumn: "Impact", sampleValue: "4", expectedField: "impact", required: true },
    ],
    rows: [
      { row: 1, reference: "R-M03-11", summary: "Calibration records incomplete", outcome: "Accepted" },
      { row: 2, reference: "R-M17-04", summary: "Fire system handover delayed", outcome: "Accepted" },
      { row: 3, reference: "R-M03-09", summary: "Already recorded, values identical", outcome: "No change" },
      {
        row: 4,
        reference: "R-M18-02",
        summary: "Waste stream contract risk",
        outcome: "Warning",
        issue: issue(4, "owner", "", "Owner missing", "Assign the risk owner before gate review", "warning"),
      },
      {
        row: 5,
        reference: "R-M03-11",
        summary: "Duplicate of row 1",
        outcome: "Rejected",
        issue: issue(5, "risk_id", "R-M03-11", "Duplicate record ID", "Remove the duplicate row or issue a new reference", "rejected"),
      },
    ],
  },
  {
    importType: "decisions",
    label: "Decisions",
    sampleName: "Decision log sample (synthetic)",
    columns: [
      { sourceColumn: "Decision Ref", sampleValue: "D-2026-044", expectedField: "decision_id", required: true },
      { sourceColumn: "Title", sampleValue: "ICU ventilation specification", expectedField: "title", required: true },
      { sourceColumn: "Owner", sampleValue: "Nabila Chowdhury", expectedField: "owner", required: true },
      { sourceColumn: "Due", sampleValue: "2026-08-21", expectedField: "due_date", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
    ],
    rows: [
      { row: 1, reference: "D-2026-044", summary: "ICU ventilation specification", outcome: "Accepted" },
      { row: 2, reference: "D-2026-045", summary: "Sterile stores layout sign-off", outcome: "Accepted" },
      {
        row: 3,
        reference: "D-2026-046",
        summary: "Security contractor scope",
        outcome: "Warning",
        issue: issue(3, "due_date", "", "Required field missing", "Set a decision due date", "warning"),
      },
      {
        row: 4,
        reference: "D-2026-047",
        summary: "Unknown module reference",
        outcome: "Rejected",
        issue: issue(4, "module_code", "M99", "Unknown module code", "Use a governed module code", "rejected"),
      },
    ],
  },
  {
    importType: "obligations",
    label: "Obligations",
    sampleName: "Counterpart obligation sample (synthetic)",
    columns: [
      { sourceColumn: "Obligation Ref", sampleValue: "OB-118", expectedField: "obligation_id", required: true },
      { sourceColumn: "Counterpart", sampleValue: "Estate Facilities Contractor", expectedField: "counterpart", required: true },
      { sourceColumn: "Owner", sampleValue: "Omar Siddiqui", expectedField: "owner", required: true },
      { sourceColumn: "Due", sampleValue: "2026-08-28", expectedField: "due_date", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
    ],
    rows: [
      { row: 1, reference: "OB-118", summary: "Calibration certificates due", outcome: "Accepted" },
      { row: 2, reference: "OB-119", summary: "Fire-system training records", outcome: "Accepted" },
      { row: 3, reference: "OB-107", summary: "Unchanged obligation", outcome: "No change" },
      {
        row: 4,
        reference: "OB-120",
        summary: "Waste contractor evidence",
        outcome: "Warning",
        issue: issue(4, "evidence_required", "", "Required field missing", "State the evidence the counterpart must supply", "warning"),
      },
    ],
  },
  {
    importType: "deliverables",
    label: "Deliverables",
    sampleName: "Deliverable register sample (synthetic)",
    columns: [
      { sourceColumn: "Del ID", sampleValue: "DL-M03-07", expectedField: "deliverable_id", required: true },
      { sourceColumn: "Level", sampleValue: "L2", expectedField: "level", required: true },
      { sourceColumn: "Parent", sampleValue: "DL-M03-02", expectedField: "parent_id", required: false },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
      { sourceColumn: "Owner", sampleValue: "Dr. Arif Hasan", expectedField: "owner", required: true },
    ],
    rows: [
      { row: 1, reference: "DL-M03-07", summary: "ICU clinical dry-run report", outcome: "Accepted" },
      { row: 2, reference: "DL-M17-03", summary: "Fire strategy compliance pack", outcome: "Accepted" },
      {
        row: 3,
        reference: "DL-M21-02",
        summary: "Surgical readiness pack",
        outcome: "Warning",
        issue: issue(3, "standard_id", "PLACEHOLDER-XYZ-999", "Placeholder standard ID not on the demo whitelist", "Use a whitelisted placeholder standard", "warning"),
      },
      {
        row: 4,
        reference: "DL-M14-05",
        summary: "L2 deliverable with no parent",
        outcome: "Rejected",
        issue: issue(4, "parent_id", "", "Required field missing", "L1 to L3 deliverables require a parent", "rejected"),
      },
    ],
  },
  {
    importType: "evidence",
    label: "Evidence metadata",
    sampleName: "Evidence metadata sample (synthetic)",
    columns: [
      { sourceColumn: "Doc Title", sampleValue: "ICU equipment readiness checklist", expectedField: "document_title", required: true },
      { sourceColumn: "Type", sampleValue: "Report", expectedField: "document_type", required: true },
      { sourceColumn: "Version", sampleValue: "v0.4", expectedField: "version", required: true },
      { sourceColumn: "Effective", sampleValue: "2026-08-14", expectedField: "effective_date", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
    ],
    rows: [
      { row: 1, reference: "DOC-ICU-221", summary: "ICU equipment readiness checklist v0.4", outcome: "Accepted" },
      { row: 2, reference: "DOC-IPC-090", summary: "Hand hygiene audit report v1.1", outcome: "Accepted" },
      { row: 3, reference: "DOC-ICU-118", summary: "Unchanged metadata", outcome: "No change" },
      {
        row: 4,
        reference: "DOC-FIR-045",
        summary: "Fire drill record",
        outcome: "Warning",
        issue: issue(4, "effective_date", "14/08/26", "Invalid date", "Use ISO format YYYY-MM-DD", "warning"),
      },
    ],
  },
  {
    importType: "mandays",
    label: "Man-day entries",
    sampleName: "Effort record sample (synthetic)",
    columns: [
      { sourceColumn: "Date", sampleValue: "2026-08-03", expectedField: "entry_date", required: true },
      { sourceColumn: "Consultant", sampleValue: "Dr. Arif Hasan", expectedField: "consultant", required: true },
      { sourceColumn: "Module", sampleValue: "M03", expectedField: "module_code", required: true },
      { sourceColumn: "WP", sampleValue: "WP-M03-04", expectedField: "work_package", required: true },
      { sourceColumn: "Days", sampleValue: "1.5", expectedField: "days", required: true },
    ],
    rows: [
      { row: 1, reference: "EF-2026-31", summary: "1.5 days acceptance-test supervision", outcome: "Accepted" },
      { row: 2, reference: "EF-2026-32", summary: "0.5 days evidence collation", outcome: "Accepted" },
      {
        row: 3,
        reference: "EF-2026-33",
        summary: "Zero-day entry",
        outcome: "Rejected",
        issue: issue(3, "days", "0", "Man-day value zero or negative", "Record a positive number of days", "rejected"),
      },
      {
        row: 4,
        reference: "EF-2026-34",
        summary: "Negative correction attempt",
        outcome: "Rejected",
        issue: issue(4, "days", "-2", "Man-day value zero or negative", "Use a reversal entry instead of a negative import row", "rejected"),
      },
    ],
  },
  {
    importType: "registry",
    label: "Module registry change set",
    sampleName: "Registry change-set sample (synthetic)",
    columns: [
      { sourceColumn: "Module Code", sampleValue: "M30", expectedField: "module_code", required: true },
      { sourceColumn: "Name", sampleValue: "Pharmacy Automation Readiness", expectedField: "module_name", required: true },
      { sourceColumn: "Estate", sampleValue: "Estate E", expectedField: "estate", required: true },
      { sourceColumn: "Source Doc", sampleValue: "SCH-001 rev C", expectedField: "source_ref", required: true },
    ],
    rows: [
      {
        row: 1,
        reference: "M30",
        summary: "Proposed addition, routed to owner approval",
        outcome: "Warning",
        issue: issue(1, "module_code", "M30", "Registry changes cannot be applied by import", "Submit a registry change proposal for owner approval", "warning"),
      },
      {
        row: 2,
        reference: "M03",
        summary: "Duplicate module code",
        outcome: "Rejected",
        issue: issue(2, "module_code", "M03", "Duplicate module code", "Amend the existing module through a proposal", "rejected"),
      },
    ],
  },
];

export function datasetFor(importType: string) {
  return importDatasets.find((d) => d.importType === importType);
}

export function countOutcomes(rows: ImportRowView[]) {
  return {
    accepted: rows.filter((r) => r.outcome === "Accepted").length,
    warnings: rows.filter((r) => r.outcome === "Warning").length,
    rejected: rows.filter((r) => r.outcome === "Rejected").length,
    noChange: rows.filter((r) => r.outcome === "No change").length,
  };
}

/* --------------------------------- Seeds ---------------------------------- */

export const seedReceipts: IntakeReceiptView[] = [
  {
    id: "IMP-DEMO-0042",
    source: "SCH-001 schedule sample",
    dataType: "Schedule and work packages",
    startedBy: "Nabila Chowdhury",
    startedAt: "4 Aug 2026, 17:05",
    accepted: 42,
    warnings: 3,
    rejected: 2,
    noChange: 6,
    status: "Completed with warnings",
    reason: "Initial SCH-001 baseline load for the commissioning schedule.",
    mapping: datasetFor("schedule")!.columns.map((c) => ({
      sourceColumn: c.sourceColumn,
      sampleValue: c.sampleValue,
      expectedField: c.expectedField,
      required: c.required,
    })),
    issues: datasetFor("schedule")!.rows.flatMap((r) => (r.issue ? [r.issue] : [])),
    acknowledgedWarnings: true,
    objectRefs: ["WP-M03-04", "WP-M03-05", "WP-M17-02"],
    traceId: "trc-imp-0042",
  },
];

export const seedProposals: RegistryChangeProposalView[] = [
  {
    id: "PRP-0007",
    changeType: "Add module",
    moduleCode: "M30",
    moduleName: "Pharmacy Automation Readiness",
    estate: "Estate E",
    crosswalk: "PRD 4.12",
    rationale:
      "Pharmacy automation commissioning is currently tracked inside M09 and cannot be evidenced separately at the gate.",
    sourceRef: "SCH-001 rev C, section 4.12",
    effectiveDate: "2026-09-01",
    requestedBy: "Nabila Chowdhury",
    requestedAt: "5 Aug 2026, 07:40",
    impact:
      "Adds one module to schedule reporting, one row to programme dashboards, and creates a new mapping and gap-analysis scope.",
    status: "Pending owner approval",
    validation: [
      { check: "Required fields", result: "pass", detail: "All required proposal fields are present." },
      { check: "Duplicate module code", result: "pass", detail: "M30 is not present in the governed registry." },
      { check: "Code format", result: "pass", detail: "M30 matches the M## convention." },
      { check: "Estate present", result: "pass", detail: "Estate E is a known estate." },
      { check: "Source-document reference", result: "pass", detail: "SCH-001 rev C, section 4.12 provided." },
      { check: "Schedule reference impact", result: "warning", detail: "SCH-001 milestones must be re-issued for the new module." },
      { check: "Downstream dashboard impact", result: "warning", detail: "Programme totals and RAG mix change once approved." },
      { check: "Mapping and gap-analysis impact", result: "warning", detail: "A new mapping scope must be run before evidence claims." },
    ],
  },
];

export const seedIntakeRecords: ProgrammeRecordDraft[] = [
  {
    id: "RSK-D-0001",
    kind: "risk",
    title: "ICU ventilator commissioning slips past clinical dry-run",
    moduleCode: "M03",
    owner: "Dr. Arif Hasan",
    effectiveDate: "2026-09-04",
    source: "SCH-001 WP-M03-04 status note",
    reason: "Raised after the weekly ICU readiness review.",
    classification: "Internal",
    status: "Draft",
    fields: {
      likelihood: "4 - Likely",
      impactRating: "4 - Major",
      riskScore: "16",
      mitigation: "Book a second acceptance-testing window.",
    },
    createdBy: "Dr. Arif Hasan",
    createdAt: "5 Aug 2026, 07:12",
    history: [
      { at: "5 Aug 2026, 07:12", actor: "Dr. Arif Hasan", change: "Draft created", reason: "Awaiting submission for validation" },
    ],
  },
  {
    id: "DEC-D-0002",
    kind: "decision",
    title: "Confirm ICU isolation room ventilation standard",
    moduleCode: "M03",
    owner: "Nabila Chowdhury",
    effectiveDate: "2026-08-21",
    source: "SOP-ICU-014 draft v0.3",
    reason: "Blocking evidence registration for two ICU requirements.",
    classification: "Programme confidential",
    status: "Draft",
    fields: { recommended: "Option B, subject to infection-prevention sign-off" },
    createdBy: "Nabila Chowdhury",
    createdAt: "5 Aug 2026, 07:20",
    history: [
      { at: "5 Aug 2026, 07:20", actor: "Nabila Chowdhury", change: "Draft created", reason: "Awaiting owner submission" },
    ],
  },
  {
    id: "EVD-A-0003",
    kind: "evidence",
    title: "ICU equipment readiness checklist",
    moduleCode: "M03",
    owner: "Dr. Arif Hasan",
    effectiveDate: "2026-08-14",
    source: "Controlled document library ref DOC-ICU-221",
    reason: "Registered against a missing-evidence finding for ICU equipment readiness.",
    classification: "Internal",
    status: "Accepted",
    fields: { docType: "Report", version: "v0.4", state: "Missing evidence closed", standards: "PLACEHOLDER-ICU-001" },
    createdBy: "Dr. Arif Hasan",
    createdAt: "4 Aug 2026, 16:02",
    history: [
      { at: "4 Aug 2026, 16:02", actor: "Dr. Arif Hasan", change: "Registered metadata only", reason: "No file content is stored in this mockup" },
    ],
  },
];

export const seedLedger: LedgerEntryView[] = [
  {
    id: "MD-2026-0088",
    date: "1 Aug 2026",
    consultant: "Dr. Arif Hasan",
    moduleCode: "M03",
    workPackage: "WP-M03-04",
    days: 2,
    activity: "ICU ventilator acceptance-test supervision",
    source: "Approved effort record sheet EF-2026-29",
    kind: "Original",
    recordedBy: "Nabila Chowdhury",
  },
  {
    id: "MD-2026-0088-R",
    date: "3 Aug 2026",
    consultant: "Dr. Arif Hasan",
    moduleCode: "M03",
    workPackage: "WP-M03-04",
    days: -2,
    activity: "Reversal of MD-2026-0088",
    source: "Correction request COR-0039",
    kind: "Reversal",
    linkedTo: "MD-2026-0088",
    recordedBy: "Nabila Chowdhury",
    reason: "Effort was logged against the wrong work package.",
  },
  {
    id: "MD-2026-0091",
    date: "3 Aug 2026",
    consultant: "Dr. Arif Hasan",
    moduleCode: "M03",
    workPackage: "WP-M03-05",
    days: 2,
    activity: "ICU clinical dry-run preparation",
    source: "Correction request COR-0039",
    kind: "Replacement",
    linkedTo: "MD-2026-0088",
    recordedBy: "Nabila Chowdhury",
    reason: "Replacement entry against the correct work package.",
  },
];

export function ledgerChains(entries: LedgerEntryView[]) {
  const originals = entries.filter((e) => e.kind === "Original");
  return originals.map((original) => ({
    original,
    reversal: entries.find((e) => e.kind === "Reversal" && e.linkedTo === original.id),
    replacement: entries.find((e) => e.kind === "Replacement" && e.linkedTo === original.id),
  }));
}

export function healthTone(health: DataSourceStatusView["health"]) {
  return health === "Healthy" ? "success" : health === "Attention" ? "warning" : "danger";
}
