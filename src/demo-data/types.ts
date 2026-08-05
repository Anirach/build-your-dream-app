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