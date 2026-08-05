// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.

export type Rag = "green" | "amber" | "red";
export type RoleId = "exec" | "pmo" | "lead" | "reviewer" | "auditor";

export interface Person {
  id: string;
  name: string;
  title: string;
  fictional: boolean;
}

export interface ModuleSummary {
  id: string;
  code: string;
  label: string;
  estate: string;
  rag: Rag;
  progress: number;
  stage: string;
  nextGate: string;
  baselineVarianceDays: number;
  openRisks: number;
  criticalIssues: number;
  evidenceGaps: number;
  ownerId: string;
  overduePackages: number;
  causes: CauseKey[];
}

export type CauseKey =
  | "schedule-slippage"
  | "evidence-incomplete"
  | "critical-risk"
  | "dependency-blocked"
  | "decision-overdue";

export interface ModuleStatusDriver {
  rule: string;
  source: string;
  value: string;
  threshold: string;
  result: "breach" | "watch" | "pass";
  detail: string;
  link?: { to: string; label: string };
}

export interface WorkPackageSummary {
  id: string;
  name: string;
  owner: string;
  due: string;
  state: "Overdue" | "In progress" | "Not started" | "Complete";
  dependency: string;
}

export interface RiskSummary {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium";
  status: "Open" | "Mitigating" | "Closed";
  owner: string;
  raised: string;
}

export interface DependencySummary {
  id: string;
  title: string;
  from: string;
  baseline: string;
  forecast: string;
  state: "Blocked" | "At risk" | "On track";
}

export interface DeliverableSummary {
  id: string;
  name: string;
  stage: string;
  due: string;
  state: "Draft" | "Submitted" | "Approved" | "Not started";
  owner: string;
}

export interface EvidenceSummary {
  id: string;
  name: string;
  requirement: string;
  state: "Present" | "Partial" | "Missing" | "Present - unverified";
  reference: string;
  updated: string;
}

export interface DecisionSummary {
  id: string;
  title: string;
  owner: string;
  due: string;
  ageDays: number;
  urgency: "High" | "Medium" | "Low";
  moduleCode: string;
}

export interface MilestoneView {
  id: string;
  label: string;
  baseline: string;
  forecast: string;
  state: "On track" | "Watch" | "At risk";
}

export interface StandardRecord {
  id: string;
  chapter: string;
  title: string;
  paraphrase: string;
  classification: "Standard" | "Measurable element";
  language: string;
  crosswalk: boolean;
  relatedModules: string[];
  measurableElements: { id: string; text: string }[];
  matchReasons: string[];
  relevance: number;
  keywords: string[];
}

export interface MappingRowView {
  id: string;
  clauseNo: number;
  clausePreview: string;
  clauseFull: string;
  sourceRef: string;
  keyPhrases: string[];
  standardId: string | null;
  measurableElement: string | null;
  confidence: number;
  citationValid: boolean;
  rationale: string;
  reviewStatus: "Not reviewed" | "Approved" | "Edited" | "Rejected" | "Added";
}

export interface ReviewQueueItem {
  id: string;
  item: string;
  moduleCode: string;
  draftType: string;
  submittedBy: string;
  submitted: string;
  due: string;
  effort: string;
  citation: "Valid" | "Invalid";
  status: "Awaiting review" | "Returned for correction" | "Approved" | "Auto-rejected";
  reason?: string;
  overdue: boolean;
  stale?: boolean;
}

export interface GapMatrixRowView {
  id: string;
  requirementId: string;
  summary: string;
  currentEvidence: string;
  citation: string;
  state: "Present" | "Partial" | "Absent" | "Present - unverified";
  confidence: number;
  proposedModule: string;
  proposedOwner: string;
  nextAction: string;
  reviewStatus: "Not reviewed" | "Approved" | "Returned";
  whyAssigned: string;
  missingEvidence: string[];
  inputDocuments: string[];
}

export interface GapAnalysisSummary {
  id: string;
  name: string;
  moduleCode: string;
  scope: string;
  version: string;
  lastRun: string;
  documentsAssessed: number;
  present: number;
  partial: number;
  absent: number;
  unverified: number;
  ownerReviewState: string;
  runId: string;
  model: string;
  promptHash: string;
  rows: GapMatrixRowView[];
}

export interface AuditEventView {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "Human" | "Agent" | "Sync" | "System";
  action: string;
  objectType: string;
  objectRef: string;
  beforeAfter: string;
  reason: string;
  traceId: string;
  promptHash?: string;
}

export interface AgentRunSummary {
  id: string;
  sop: string;
  moduleCode: string;
  created: string;
  status: "DRAFT" | "In review" | "Approved";
  model: string;
  promptHash: string;
  inputDocument: string;
  clauses: number;
  mapped: number;
  noMatch: number;
  lowConfidence: number;
  invalidCitations: number;
}

/* ---------- Governed data intake and administration (concept-only) ---------- */

export type IntakeRecordKind =
  | "risk"
  | "decision"
  | "obligation"
  | "deliverable"
  | "evidence"
  | "workpackage"
  | "manday";

export interface ProgrammeRecordDraft {
  id: string;
  kind: IntakeRecordKind;
  title: string;
  moduleCode: string;
  owner: string;
  effectiveDate: string;
  source: string;
  reason: string;
  classification: string;
  status: "Draft" | "Accepted";
  /** Kind-specific synthetic fields shown in review and detail views. */
  fields: Record<string, string>;
  createdBy: string;
  createdAt: string;
  history: { at: string; actor: string; change: string; reason: string }[];
}

export interface ValidationIssueView {
  row: number;
  field: string;
  value: string;
  problem: string;
  suggestion: string;
  severity: "warning" | "rejected";
}

export interface ColumnMappingView {
  sourceColumn: string;
  sampleValue: string;
  expectedField: string;
  required: boolean;
}

export interface IntakeReceiptView {
  id: string;
  source: string;
  dataType: string;
  startedBy: string;
  startedAt: string;
  accepted: number;
  warnings: number;
  rejected: number;
  noChange: number;
  status: "Completed" | "Completed with warnings" | "Rejected";
  reason: string;
  mapping: ColumnMappingView[];
  issues: ValidationIssueView[];
  acknowledgedWarnings: boolean;
  objectRefs: string[];
  traceId: string;
}

export interface RegistryChangeProposalView {
  id: string;
  changeType: "Add module" | "Amend module" | "Retire module";
  moduleCode: string;
  moduleName: string;
  estate: string;
  crosswalk: string;
  rationale: string;
  sourceRef: string;
  effectiveDate: string;
  requestedBy: string;
  requestedAt: string;
  impact: string;
  status: "Pending owner approval" | "Approved" | "Rejected";
  validation: { check: string; result: "pass" | "warning" | "fail"; detail: string }[];
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

export interface LedgerEntryView {
  id: string;
  date: string;
  consultant: string;
  moduleCode: string;
  workPackage: string;
  days: number;
  activity: string;
  source: string;
  kind: "Original" | "Reversal" | "Replacement";
  linkedTo?: string;
  recordedBy: string;
  reason?: string;
}

export interface DataSourceStatusView {
  id: string;
  name: string;
  authoritativeSource: string;
  owner: string;
  intakeMethod: string;
  productionPath: string;
  lastLoad: string;
  accepted: number;
  warnings: number;
  rejected: number;
  health: "Healthy" | "Attention" | "Source definition required";
  description: string;
  expectedFields: string[];
  validationRules: string[];
  receiptIds: string[];
  importType?: string;
}
