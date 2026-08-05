// Concept-only presentation model for the Production Readiness Center.
// Synthetic data only. Nothing here is production evidence.

export type MockCapability = "Implemented" | "Partial" | "Not represented";
export type ProductionAcceptance =
  | "Not assessed"
  | "Evidence missing"
  | "Ready for review"
  | "Accepted";

export type PacketId = "sprint-0" | "sprint-1" | "sprint-2" | "sprint-3" | "sprint-4";

export interface ReadinessPacket {
  id: PacketId;
  code: string;
  name: string;
  scope: string[];
  exclusions: string[];
  acceptanceGate: string;
  acceptanceCriteria: string[];
  /** Artifact IDs in the evidence register that must be Ready for review. */
  requiredEvidence: string[];
  owner: string;
  ownerRole: string;
  reviewer: string;
  reviewerRole: string;
  plannedStart: string;
  plannedEnd: string;
  actual: string;
  dependencies: string[];
  blockers: string[];
  heartbeat: string;
  mockCapability: MockCapability;
  productionAcceptance: ProductionAcceptance;
  decisions: string[];
}

export const readinessPackets: ReadinessPacket[] = [
  {
    id: "sprint-0",
    code: "Sprint 0",
    name: "Platform Foundation",
    scope: [
      "PostgreSQL 16 local container",
      "Baseline migrations 0000 and 0001",
      "Roles and grants",
      "30-module registry load",
      "SCH-001 schedule and BL0 freeze",
      "smoke_test execution",
      "Platform work packages",
    ],
    exclusions: ["No retrieval, no licensed corpus, no agent output"],
    acceptanceGate:
      "Database, schema, grants, registry and schedule evidence pass; BL0 accepted by named owner",
    acceptanceCriteria: [
      "Migrations 0000 and 0001 applied from an authoritative source",
      "Roles and grants evidence captured for every public table",
      "30-module registry matches the authoritative source list",
      "SCH-001 loaded with dependencies and milestones",
      "BL0 baseline frozen and attested",
      "smoke_test result recorded",
    ],
    requiredEvidence: ["ART-01", "ART-02", "ART-03", "ART-04", "ART-05", "ART-06", "ART-07", "ART-08", "ART-09", "ART-10", "ART-24"],
    owner: "Nadia Rahman",
    ownerRole: "Programme PMO",
    reviewer: "Tanvir Alam",
    reviewerRole: "Auditor / System Steward",
    plannedStart: "10 Aug 2026",
    plannedEnd: "28 Aug 2026",
    actual: "Not started - awaiting authoritative inputs",
    dependencies: ["None - first packet"],
    blockers: [
      "Authoritative baseline SQL and migration source not confirmed (OD-A)",
      "smoke_test result not provided",
    ],
    heartbeat: "5 Aug 2026, 09:12 - no production evidence received this week",
    mockCapability: "Partial",
    productionAcceptance: "Evidence missing",
    decisions: ["OD-A"],
  },
  {
    id: "sprint-1",
    code: "Sprint 1",
    name: "Standards Knowledge Base",
    scope: [
      "Same database as Sprint 0",
      "18 chapters plus 2 appendices manifest",
      "262 allowed standard identifiers",
      "7th-to-8th-edition crosswalk",
      "Licensed full-text role gate",
    ],
    exclusions: ["No retrieval tuning", "No licensed text stored in this mockup"],
    acceptanceGate:
      "Exactly 262 allowed IDs, no unknown IDs, corpus manifest and access control accepted",
    acceptanceCriteria: [
      "Corpus manifest lists 20 source units and their versions",
      "valid_ids contains exactly 262 identifiers",
      "No unknown identifier appears in any stored output",
      "Crosswalk coverage recorded for every mapped identifier",
      "Licensed full-text access restricted to approved roles",
    ],
    requiredEvidence: ["ART-11", "ART-12", "ART-13", "ART-14"],
    owner: "Dr Farhana Kabir",
    ownerRole: "Clinical / Quality Reviewer",
    reviewer: "Tanvir Alam",
    reviewerRole: "Auditor / System Steward",
    plannedStart: "31 Aug 2026",
    plannedEnd: "25 Sep 2026",
    actual: "Blocked by prior gate",
    dependencies: ["Sprint 0 accepted"],
    blockers: ["JCI licensing and full-text access roles not confirmed (OD-B)"],
    mockCapability: "Partial",
    productionAcceptance: "Not assessed",
    heartbeat: "5 Aug 2026, 09:12 - 0 of 262 production identifiers verified",
    decisions: ["OD-B"],
  },
  {
    id: "sprint-2",
    code: "Sprint 2",
    name: "Retrieval Quality",
    scope: [
      "pgvector and full-text retrieval",
      "Model registry with approved configurations",
      "Fixed 100-query evaluation set",
    ],
    exclusions: ["No fine-tuning", "No external model hosting decisions"],
    acceptanceGate:
      "At least 85% top-5 retrieval on the fixed evaluation set; rerun recorded after material changes",
    acceptanceCriteria: [
      "Evaluation set contains 100 fixed production queries",
      "Top-5 retrieval at or above 85%",
      "Model registry entry approved with owner and change reason",
      "Rerun recorded after any model, indexing, corpus or parameter change",
    ],
    requiredEvidence: ["ART-15", "ART-16"],
    owner: "Nadia Rahman",
    ownerRole: "Programme PMO",
    reviewer: "Dr Farhana Kabir",
    reviewerRole: "Clinical / Quality Reviewer",
    plannedStart: "28 Sep 2026",
    plannedEnd: "16 Oct 2026",
    actual: "Blocked by prior gate",
    dependencies: ["Sprint 1 accepted"],
    blockers: ["Evaluation set not available: 0 of 100 queries"],
    mockCapability: "Not represented",
    productionAcceptance: "Not assessed",
    heartbeat: "5 Aug 2026, 09:12 - evaluation not run",
    decisions: [],
  },
  {
    id: "sprint-3",
    code: "Sprint 3",
    name: "SOP Mapping Review",
    scope: [
      "Agent output remains DRAFT until reviewed",
      "Whitelist citation gate",
      "Excel review export and import round trip",
      "20-SOP gold set",
    ],
    exclusions: ["No autonomous approval", "No production file storage in this increment"],
    acceptanceGate:
      "At least 80% precision on the gold set, reviewer identity captured, invalid citations rejected",
    acceptanceCriteria: [
      "Gold set of 20 production SOPs available",
      "Precision at or above 80% on the gold set",
      "Named clinical reviewers with recorded capacity",
      "Invalid or unknown citations blocked at import",
      "Reviewer identity and decision recorded per row",
    ],
    requiredEvidence: ["ART-17", "ART-18", "ART-19"],
    owner: "Dr Farhana Kabir",
    ownerRole: "Clinical / Quality Reviewer",
    reviewer: "Nadia Rahman",
    reviewerRole: "Programme PMO",
    plannedStart: "19 Oct 2026",
    plannedEnd: "13 Nov 2026",
    actual: "Blocked by prior gate",
    dependencies: ["Sprint 2 accepted"],
    blockers: ["Gold set and named clinical reviewers required (OD-C)"],
    mockCapability: "Partial",
    productionAcceptance: "Not assessed",
    heartbeat: "5 Aug 2026, 09:12 - 0 of 20 gold-set SOPs received",
    decisions: ["OD-C"],
  },
  {
    id: "sprint-4",
    code: "Sprint 4",
    name: "Productised Gap Analysis",
    scope: [
      "JCI and DGHS comparison",
      "Real ICU and IPC source documents",
      "Run and source lineage",
      "Accountable owner review",
    ],
    exclusions: ["No scenario engine changes", "No external integrations"],
    acceptanceGate: "Evidence-linked gap matrix accepted by owners with source and run lineage",
    acceptanceCriteria: [
      "Authoritative DGHS source set defined",
      "Real ICU and IPC source packs approved",
      "Every matrix row links to a source document and run ID",
      "Accountable owner sign-off recorded per matrix",
    ],
    requiredEvidence: ["ART-20", "ART-21", "ART-22", "ART-23"],
    owner: "Rezaul Karim",
    ownerRole: "Module Lead",
    reviewer: "Dr Farhana Kabir",
    reviewerRole: "Clinical / Quality Reviewer",
    plannedStart: "16 Nov 2026",
    plannedEnd: "11 Dec 2026",
    actual: "Blocked by prior gate",
    dependencies: ["Sprint 3 accepted"],
    blockers: [
      "Authoritative DGHS source set undefined (OD-D)",
      "Real ICU and IPC source documents not approved (OD-E)",
    ],
    mockCapability: "Partial",
    productionAcceptance: "Not assessed",
    heartbeat: "5 Aug 2026, 09:12 - source packs outstanding",
    decisions: ["OD-D", "OD-E"],
  },
];

export interface OpenDecisionView {
  id: string;
  subject: string;
  ownerRole: string;
  due: string;
  blockedPacket: string;
  status: "Open" | "In discussion" | "Resolved";
  nextAction: string;
}

export const openDecisions: OpenDecisionView[] = [
  {
    id: "OD-A",
    subject: "Confirm authoritative baseline SQL and migration source",
    ownerRole: "Programme PMO",
    due: "12 Aug 2026",
    blockedPacket: "Sprint 0",
    status: "Open",
    nextAction: "Nominate the system of record for migrations 0000 and 0001",
  },
  {
    id: "OD-B",
    subject: "Confirm JCI licensing and full-text access roles",
    ownerRole: "Executive Sponsor",
    due: "19 Aug 2026",
    blockedPacket: "Sprint 1",
    status: "Open",
    nextAction: "Obtain licence position and approve the role gate",
  },
  {
    id: "OD-C",
    subject: "Name clinical reviewers and review capacity",
    ownerRole: "Clinical / Quality Reviewer",
    due: "26 Aug 2026",
    blockedPacket: "Sprint 3",
    status: "In discussion",
    nextAction: "Publish the reviewer roster with weekly capacity",
  },
  {
    id: "OD-D",
    subject: "Define authoritative DGHS source set",
    ownerRole: "Programme PMO",
    due: "9 Sep 2026",
    blockedPacket: "Sprint 4",
    status: "Open",
    nextAction: "Agree the DGHS document list, versions and owners",
  },
  {
    id: "OD-E",
    subject: "Approve real ICU and IPC source documents for Sprint 4",
    ownerRole: "Module Lead",
    due: "23 Sep 2026",
    blockedPacket: "Sprint 4",
    status: "Open",
    nextAction: "Confirm the ICU and IPC packs and their classification",
  },
];

export interface TruthRow {
  item: string;
  mock: MockCapability;
  production: string;
  link?: { to: string; label: string };
}

/** Honest baseline: a working mock screen is not production acceptance. */
export const truthModel: TruthRow[] = [
  {
    item: "Programme overview and 30-module registry",
    mock: "Implemented",
    production: "Not accepted; registry is synthetic",
    link: { to: "/programme", label: "Programme" },
  },
  { item: "M03 detailed module view", mock: "Implemented", production: "Demonstration only" },
  { item: "Other 29 detailed module views", mock: "Not represented", production: "Not assessed" },
  {
    item: "Data Intake and registry change proposals",
    mock: "Implemented",
    production: "Demonstration only",
    link: { to: "/data-intake", label: "Data Intake" },
  },
  { item: "Sprint 0 database and migrations", mock: "Not represented", production: "Evidence missing" },
  { item: "smoke_test result", mock: "Not represented", production: "Evidence missing" },
  {
    item: "SCH-001 baseline schedule and dependencies",
    mock: "Partial",
    production: "Authoritative source evidence missing",
  },
  {
    item: "JCI corpus",
    mock: "Partial",
    production: "22 synthetic placeholder records; 0 / 262 production IDs verified",
    link: { to: "/standards", label: "Standards Library" },
  },
  {
    item: "18 chapters plus 2 appendices manifest",
    mock: "Not represented",
    production: "Evidence missing",
  },
  { item: "262-ID whitelist validation", mock: "Not represented", production: "Not run" },
  { item: "7th-to-8th-edition crosswalk", mock: "Partial", production: "Evidence missing" },
  {
    item: "Retrieval evaluation",
    mock: "Not represented",
    production: "0 / 100 evaluation queries run; top-5 score unavailable",
  },
  {
    item: "SOP mapping workbench",
    mock: "Implemented",
    production: "Synthetic mappings; production gold-set gate not assessed",
    link: { to: "/workbench", label: "AI Workbench" },
  },
  {
    item: "Excel review export/import round trip",
    mock: "Not represented",
    production: "Evidence missing",
  },
  {
    item: "ICU and IPC gap analysis",
    mock: "Implemented",
    production: "Synthetic inputs; owner sign-off not completed",
    link: { to: "/gap-analysis", label: "Gap Analysis" },
  },
  {
    item: "DGHS source set",
    mock: "Partial",
    production: "Source definition and ingestion evidence missing",
  },
  {
    item: "Audit and lineage",
    mock: "Implemented",
    production: "Production persistence and immutability not evidenced",
    link: { to: "/audit", label: "Audit and Lineage" },
  },
  { item: "Backup and restore procedure", mock: "Not represented", production: "Evidence missing" },
];

export function packetById(id: string) {
  return readinessPackets.find((p) => p.id === id);
}

export const acceptanceOrder: PacketId[] = readinessPackets.map((p) => p.id);

/** Pure gate rule: a packet may only become active once every prior packet is accepted. */
export function isPacketUnlocked(id: PacketId, accepted: PacketId[]) {
  const index = acceptanceOrder.indexOf(id);
  return acceptanceOrder.slice(0, index).every((prior) => accepted.includes(prior));
}

/** WIP limit is one active packet: the earliest unlocked, unaccepted packet. */
export function activePacket(accepted: PacketId[]): PacketId | null {
  return acceptanceOrder.find((id) => !accepted.includes(id)) ?? null;
}

export type PacketDisplayState =
  | "Accepted"
  | "Active"
  | "Blocked by prior gate";

export function packetDisplayState(id: PacketId, accepted: PacketId[]): PacketDisplayState {
  if (accepted.includes(id)) return "Accepted";
  if (activePacket(accepted) === id && isPacketUnlocked(id, accepted)) return "Active";
  return "Blocked by prior gate";
}