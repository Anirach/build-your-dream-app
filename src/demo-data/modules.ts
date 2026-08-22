// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.
import type {
  CauseKey,
  DecisionSummary,
  DependencySummary,
  DeliverableSummary,
  EvidenceSummary,
  MilestoneView,
  ModuleStatusDriver,
  ModuleSummary,
  Rag,
  RiskSummary,
  WorkPackageSummary,
} from "./types";

export const MODULE_CODES = [
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09",
  "M09B",
  "M10",
  "M11",
  "M12",
  "M13",
  "M14",
  "M15",
  "M16",
  "M17",
  "M18",
  "M19",
  "M20",
  "M21",
  "M22",
  "M23",
  "M24",
  "M25",
  "M26",
  "M27",
  "M28",
  "M29",
  "M30",
] as const;

export const ESTATES = [
  "Estate A",
  "Estate B",
  "Estate C",
  "Estate D",
  "Estate E",
  "Estate F",
  "Estate G",
];

export const STAGES = [
  "Stage 0 - Mobilisation",
  "Stage 1 - Baseline Evidence Review",
  "Stage 2 - Gap Closure",
  "Stage 3 - Gate Preparation",
];

interface Seed {
  code: string;
  label: string;
  rag: Rag;
  progress: number;
  estate: string;
  owner: string;
  overdue: number;
  risks: number;
  critical: number;
  gaps: number;
  variance: number;
  stage: number;
  causes: CauseKey[];
}

const s = (
  code: string,
  label: string,
  rag: Rag,
  progress: number,
  estate: string,
  owner: string,
  overdue: number,
  risks: number,
  critical: number,
  gaps: number,
  variance: number,
  stage: number,
  causes: CauseKey[] = [],
): Seed => ({
  code,
  label,
  rag,
  progress,
  estate,
  owner,
  overdue,
  risks,
  critical,
  gaps,
  variance,
  stage,
  causes,
});

// 14 green, 11 amber, 5 red. 17 overdue work packages in total.
const seeds: Seed[] = [
  s("M01", "Programme Governance Framework", "green", 82, "Estate A", "p-nabila", 0, 2, 0, 1, 0, 3),
  s("M02", "Clinical Policy Architecture", "amber", 61, "Estate A", "p-maya", 1, 4, 0, 5, 6, 1, [
    "evidence-incomplete",
  ]),
  s("M03", "ICU Readiness", "red", 68, "Estate B", "p-arif", 4, 7, 2, 6, 18, 1, [
    "schedule-slippage",
    "evidence-incomplete",
    "critical-risk",
    "dependency-blocked",
  ]),
  s("M04", "Infection Prevention and Control", "red", 54, "Estate B", "p-sara", 3, 6, 2, 8, 14, 1, [
    "evidence-incomplete",
    "critical-risk",
  ]),
  s("M05", "Medication Management Systems", "amber", 66, "Estate B", "p-maya", 1, 3, 0, 4, 5, 2, [
    "evidence-incomplete",
  ]),
  s("M06", "Nursing Readiness and Staffing", "amber", 58, "Estate C", "p-nabila", 1, 3, 0, 5, 9, 1, [
    "schedule-slippage",
  ]),
  s("M07", "Workforce Competency Evidence", "red", 47, "Estate C", "p-nabila", 2, 5, 1, 9, 21, 1, [
    "evidence-incomplete",
    "decision-overdue",
  ]),
  s("M08", "Emergency and Trauma Services", "amber", 63, "Estate C", "p-arif", 1, 4, 0, 3, 7, 2, [
    "dependency-blocked",
  ]),
  s("M09", "Diagnostic Imaging Readiness", "green", 88, "Estate D", "p-omar", 0, 1, 0, 0, -2, 3),
  s("M09B", "Laboratory Services Readiness", "green", 79, "Estate D", "p-omar", 0, 2, 0, 1, 0, 2),
  s("M10", "Facilities and Engineering Handover", "red", 41, "Estate D", "p-omar", 3, 8, 1, 7, 25, 0, [
    "schedule-slippage",
    "critical-risk",
  ]),
  s("M11", "Medical Equipment Commissioning", "amber", 64, "Estate D", "p-omar", 1, 3, 0, 4, 8, 2, [
    "schedule-slippage",
  ]),
  s("M12", "Digital and Clinical Systems", "amber", 60, "Estate E", "p-nabila", 1, 4, 0, 6, 10, 1, [
    "dependency-blocked",
  ]),
  s("M13", "Data Governance and Reporting", "green", 84, "Estate E", "p-nabila", 0, 1, 0, 1, -1, 3),
  s("M14", "Supply Chain and Sterile Stores", "amber", 57, "Estate E", "p-omar", 1, 3, 0, 5, 11, 1, [
    "evidence-incomplete",
  ]),
  s("M15", "Quality and Patient Safety System", "green", 86, "Estate F", "p-maya", 0, 2, 0, 0, 0, 3),
  s("M16", "Patient Experience and Rights", "green", 81, "Estate F", "p-maya", 0, 1, 0, 2, 0, 2),
  s("M17", "Facility Safety and Fire Systems", "red", 44, "Estate F", "p-omar", 2, 6, 1, 8, 19, 0, [
    "schedule-slippage",
    "decision-overdue",
  ]),
  s("M18", "Environmental Services", "amber", 62, "Estate F", "p-sara", 0, 3, 0, 4, 6, 1, [
    "evidence-incomplete",
  ]),
  s("M19", "Radiation Safety Programme", "green", 90, "Estate G", "p-omar", 0, 1, 0, 0, -3, 3),
  s("M20", "Blood and Transfusion Services", "green", 78, "Estate G", "p-sara", 0, 2, 0, 1, 0, 2),
  s("M21", "Surgical Services Readiness", "amber", 59, "Estate B", "p-arif", 0, 4, 0, 5, 8, 1, [
    "evidence-incomplete",
  ]),
  s("M22", "Anaesthesia and Sedation", "green", 80, "Estate B", "p-arif", 0, 2, 0, 1, 0, 2),
  s("M23", "Rehabilitation and Allied Health", "green", 83, "Estate C", "p-maya", 0, 1, 0, 0, 0, 3),
  s("M24", "Outpatient and Access Pathways", "amber", 65, "Estate C", "p-nabila", 0, 3, 0, 3, 4, 2, [
    "decision-overdue",
  ]),
  s("M25", "Nutrition and Dietetics", "green", 87, "Estate E", "p-sara", 0, 1, 0, 0, 0, 3),
  s("M26", "Biomedical Waste Management", "green", 76, "Estate E", "p-sara", 0, 2, 0, 2, 1, 2),
  s("M27", "Security and Access Control", "amber", 55, "Estate G", "p-omar", 0, 3, 0, 6, 12, 1, [
    "dependency-blocked",
  ]),
  s("M28", "Training and Simulation Readiness", "green", 85, "Estate G", "p-nabila", 0, 1, 0, 1, 0, 3),
  s("M29", "Accreditation Submission Pack", "green", 74, "Estate A", "p-maya", 0, 2, 0, 2, 2, 2),
  s("M30", "Handover and Operational Transition", "amber", 63, "Estate A", "p-arif", 1, 3, 0, 4, 7, 2, [
    "evidence-incomplete",
  ]),
];

export const modules: ModuleSummary[] = seeds.map((seed) => ({
  id: seed.code,
  code: seed.code,
  label: seed.label,
  estate: seed.estate,
  rag: seed.rag,
  progress: seed.progress,
  stage: STAGES[seed.stage] ?? STAGES[0]!,
  nextGate: seed.stage >= 3 ? "PG2 - 12 Oct 2026" : "PG1 - 26 Aug 2026",
  baselineVarianceDays: seed.variance,
  openRisks: seed.risks,
  criticalIssues: seed.critical,
  evidenceGaps: seed.gaps,
  ownerId: seed.owner,
  overduePackages: seed.overdue,
  causes: seed.causes,
}));

export const LABEL_DISCLAIMER =
  "Module labels are placeholders pending the official 30-module registry.";

export function moduleByCode(code: string) {
  return modules.find((m) => m.code === code);
}

export const programmeSummary = {
  rag: "amber" as Rag,
  explanation:
    "The programme is progressing, but 5 modules require intervention before the next gate.",
  baseline: "BL0 - SCH-001 as issued",
  nextMilestone: "Programme Gate 1 - 21 days",
  totalModules: 30,
  redModules: 5,
  amberModules: 11,
  greenModules: 14,
  overduePackages: 17,
  decisionsAwaiting: 8,
  lastRefreshed: "5 Aug 2026, 09:12",
};

export const programmeStatusDrivers: ModuleStatusDriver[] = [
  {
    rule: "R-01 Red module ratio",
    source: "30 module status records",
    value: "5 red (16.7%)",
    threshold: "Amber at >= 2 red, Red at >= 8 red",
    result: "watch",
    detail: "Five modules breach at least one red rule, which places the programme in amber.",
  },
  {
    rule: "R-02 Overdue work packages",
    source: "Work package register (synthetic)",
    value: "17 overdue",
    threshold: "Amber at >= 10, Red at >= 30",
    result: "watch",
    detail: "Overdue packages are concentrated in M03, M04, M10 and M17.",
  },
  {
    rule: "R-03 Unresolved critical risks",
    source: "Risk register (synthetic)",
    value: "7 critical open",
    threshold: "Amber at >= 3, Red at >= 12",
    result: "watch",
    detail: "Two critical risks sit inside the ICU readiness scope.",
  },
  {
    rule: "R-04 Baseline milestone variance",
    source: "BL0 - SCH-001 frozen baseline",
    value: "PG1 forecast +4 days",
    threshold: "Amber at > 0 days, Red at > 14 days",
    result: "watch",
    detail: "Gate 1 forecast has slipped four days against the frozen baseline.",
  },
  {
    rule: "R-05 Owner decisions overdue",
    source: "Decision log (synthetic)",
    value: "8 awaiting owner action",
    threshold: "Amber at >= 5, Red at >= 15",
    result: "watch",
    detail: "Three decisions are older than 10 days.",
  },
];

export const moduleStatusDrivers: Record<string, ModuleStatusDriver[]> = {
  M03: [
    {
      rule: "R-11 Overdue work packages in module",
      source: "4 work package records",
      value: "4 overdue",
      threshold: "Red at >= 3",
      result: "breach",
      detail: "WP-0312, WP-0318, WP-0324 and WP-0331 are past their baseline finish dates.",
      link: { to: "packages", label: "Open work packages" },
    },
    {
      rule: "R-12 Unresolved critical risks",
      source: "Risk register entries RSK-0341, RSK-0357",
      value: "2 critical open",
      threshold: "Red at >= 2",
      result: "breach",
      detail: "Both risks remain unmitigated beyond their review date.",
      link: { to: "risks", label: "Open risk register" },
    },
    {
      rule: "R-13 Dependency past baseline",
      source: "Dependency DEP-0209 from M10",
      value: "1 blocked",
      threshold: "Amber at >= 1",
      result: "breach",
      detail: "Facilities handover of the ICU wing is blocked, which stalls commissioning tests.",
      link: { to: "risks", label: "Open dependencies" },
    },
    {
      rule: "R-14 Mandatory evidence completeness",
      source: "37 mandatory evidence items",
      value: "6 missing",
      threshold: "Red at >= 5 missing",
      result: "breach",
      detail: "Stage-1 baseline evidence review cannot complete while mandatory items are missing.",
      link: { to: "evidence", label: "Open evidence register" },
    },
  ],
};

export const workPackages: Record<string, WorkPackageSummary[]> = {
  M03: [
    {
      id: "WP-0312",
      name: "ICU baseline document collection",
      owner: "Dr. Arif Hasan",
      due: "24 Jul 2026",
      state: "Overdue",
      dependency: "None",
    },
    {
      id: "WP-0318",
      name: "High-alert medication double-check evidence",
      owner: "Dr. Maya Rahman",
      due: "29 Jul 2026",
      state: "Overdue",
      dependency: "WP-0312",
    },
    {
      id: "WP-0324",
      name: "Critical care competency matrix compilation",
      owner: "Nabila Chowdhury",
      due: "31 Jul 2026",
      state: "Overdue",
      dependency: "WP-0312",
    },
    {
      id: "WP-0331",
      name: "ICU environmental monitoring log review",
      owner: "Sara Karim",
      due: "3 Aug 2026",
      state: "Overdue",
      dependency: "DEP-0209",
    },
    {
      id: "WP-0335",
      name: "Placeholder standards mapping review",
      owner: "Dr. Maya Rahman",
      due: "12 Aug 2026",
      state: "In progress",
      dependency: "WP-0318",
    },
    {
      id: "WP-0341",
      name: "ICU gap matrix owner acceptance",
      owner: "Dr. Arif Hasan",
      due: "19 Aug 2026",
      state: "Not started",
      dependency: "WP-0335",
    },
    {
      id: "WP-0349",
      name: "Gate 1 readiness pack assembly",
      owner: "Nabila Chowdhury",
      due: "24 Aug 2026",
      state: "Not started",
      dependency: "WP-0341",
    },
  ],
};

export const risks: Record<string, RiskSummary[]> = {
  M03: [
    {
      id: "RSK-0341",
      title: "Critical care competency evidence cannot be verified before Gate 1",
      severity: "Critical",
      status: "Open",
      owner: "Nabila Chowdhury",
      raised: "9 Jul 2026",
    },
    {
      id: "RSK-0357",
      title: "Isolation-room environmental monitoring records incomplete",
      severity: "Critical",
      status: "Open",
      owner: "Sara Karim",
      raised: "16 Jul 2026",
    },
    {
      id: "RSK-0362",
      title: "Medication double-check documentation inconsistent across shifts",
      severity: "High",
      status: "Mitigating",
      owner: "Dr. Maya Rahman",
      raised: "21 Jul 2026",
    },
    {
      id: "RSK-0370",
      title: "Emergency equipment readiness log format not agreed",
      severity: "Medium",
      status: "Open",
      owner: "Dr. Arif Hasan",
      raised: "27 Jul 2026",
    },
  ],
};

export const dependencies: Record<string, DependencySummary[]> = {
  M03: [
    {
      id: "DEP-0209",
      title: "ICU wing facilities handover certificate",
      from: "M10 - Facilities and Engineering Handover",
      baseline: "27 Jul 2026",
      forecast: "21 Aug 2026",
      state: "Blocked",
    },
    {
      id: "DEP-0214",
      title: "Clinical systems ICU order-set configuration",
      from: "M12 - Digital and Clinical Systems",
      baseline: "14 Aug 2026",
      forecast: "19 Aug 2026",
      state: "At risk",
    },
    {
      id: "DEP-0221",
      title: "Biomedical equipment calibration certificates",
      from: "M11 - Medical Equipment Commissioning",
      baseline: "20 Aug 2026",
      forecast: "20 Aug 2026",
      state: "On track",
    },
  ],
};

export const deliverables: Record<string, DeliverableSummary[]> = {
  M03: [
    {
      id: "DEL-0301",
      name: "ICU baseline evidence register",
      stage: "Stage 1",
      due: "12 Aug 2026",
      state: "Draft",
      owner: "Dr. Arif Hasan",
    },
    {
      id: "DEL-0302",
      name: "ICU placeholder standards mapping workbook",
      stage: "Stage 1",
      due: "17 Aug 2026",
      state: "Submitted",
      owner: "Dr. Maya Rahman",
    },
    {
      id: "DEL-0303",
      name: "ICU gap matrix v0.4",
      stage: "Stage 2",
      due: "28 Aug 2026",
      state: "Draft",
      owner: "Sara Karim",
    },
    {
      id: "DEL-0304",
      name: "ICU readiness gate submission",
      stage: "Stage 3",
      due: "9 Sep 2026",
      state: "Not started",
      owner: "Nabila Chowdhury",
    },
  ],
};

export const evidenceItems: Record<string, EvidenceSummary[]> = {
  M03: [
    {
      id: "EV-1201",
      name: "Critical-care staff competency records",
      requirement: "DEMO-JCI-014",
      state: "Missing",
      reference: "Not received",
      updated: "-",
    },
    {
      id: "EV-1202",
      name: "High-alert medication double-check log",
      requirement: "DEMO-JCI-027",
      state: "Partial",
      reference: "SYN-DOC-0442, p.3",
      updated: "28 Jul 2026",
    },
    {
      id: "EV-1203",
      name: "Isolation-room environmental monitoring records",
      requirement: "DEMO-JCI-041",
      state: "Missing",
      reference: "Not received",
      updated: "-",
    },
    {
      id: "EV-1204",
      name: "ICU nursing handover protocol",
      requirement: "DEMO-JCI-002",
      state: "Present",
      reference: "SYN-DOC-0417, p.1-4",
      updated: "22 Jul 2026",
    },
    {
      id: "EV-1205",
      name: "Emergency equipment readiness checklist",
      requirement: "DEMO-JCI-033",
      state: "Present - unverified",
      reference: "SYN-DOC-0451, p.2",
      updated: "30 Jul 2026",
    },
    {
      id: "EV-1206",
      name: "Ventilator maintenance schedule",
      requirement: "DEMO-DGHS-003",
      state: "Present",
      reference: "SYN-DOC-0460, p.6",
      updated: "1 Aug 2026",
    },
    {
      id: "EV-1207",
      name: "ICU infection surveillance escalation records",
      requirement: "DEMO-JCI-019",
      state: "Partial",
      reference: "SYN-DOC-0463, p.9",
      updated: "2 Aug 2026",
    },
    {
      id: "EV-1208",
      name: "Sedation monitoring competency attestation",
      requirement: "DEMO-JCI-052",
      state: "Missing",
      reference: "Not received",
      updated: "-",
    },
  ],
};

export const evidenceCompleteness = { present: 18, partial: 9, missing: 6, unverified: 4 };

export const gateChecklist = [
  { label: "Baseline documents received", state: "Partial" },
  { label: "JCI mapping reviewed", state: "In progress" },
  { label: "DGHS overlay checked", state: "Not started" },
  { label: "Gap matrix approved", state: "Not started" },
  { label: "Owner acceptance", state: "Blocked" },
];

export const progressSeries = [
  { week: "W23", planned: 22, actual: 20 },
  { week: "W25", planned: 34, actual: 30 },
  { week: "W27", planned: 48, actual: 41 },
  { week: "W29", planned: 60, actual: 52 },
  { week: "W31", planned: 72, actual: 61 },
  { week: "W32", planned: 78, actual: 68 },
];

export const decisions: DecisionSummary[] = [
  {
    id: "DEC-0117",
    title: "Approve substitute ICU competency evidence format",
    owner: "Nabila Chowdhury",
    due: "7 Aug 2026",
    ageDays: 12,
    urgency: "High",
    moduleCode: "M03",
  },
  {
    id: "DEC-0121",
    title: "Confirm fire-system commissioning witness authority",
    owner: "Omar Siddiqui",
    due: "10 Aug 2026",
    ageDays: 9,
    urgency: "High",
    moduleCode: "M17",
  },
  {
    id: "DEC-0124",
    title: "Accept revised outpatient access pathway scope",
    owner: "Nabila Chowdhury",
    due: "18 Aug 2026",
    ageDays: 4,
    urgency: "Medium",
    moduleCode: "M24",
  },
];

export const milestones: MilestoneView[] = [
  { id: "PG1", label: "Programme Gate 1", baseline: "26 Aug 2026", forecast: "30 Aug 2026", state: "Watch" },
  { id: "DC01", label: "ICU evidence baseline", baseline: "12 Aug 2026", forecast: "24 Aug 2026", state: "At risk" },
  { id: "DC02", label: "IPC evidence baseline", baseline: "19 Aug 2026", forecast: "26 Aug 2026", state: "Watch" },
  { id: "PG2", label: "Programme Gate 2", baseline: "12 Oct 2026", forecast: "12 Oct 2026", state: "On track" },
  { id: "DC03", label: "Facilities handover pack", baseline: "21 Sep 2026", forecast: "5 Oct 2026", state: "At risk" },
  { id: "DC04", label: "Accreditation submission draft", baseline: "9 Oct 2026", forecast: "9 Oct 2026", state: "On track" },
  { id: "PG3", label: "Programme Gate 3", baseline: "23 Oct 2026", forecast: "23 Oct 2026", state: "On track" },
];

export const CAUSE_LABELS: Record<CauseKey, string> = {
  "schedule-slippage": "Schedule slippage",
  "evidence-incomplete": "Evidence incomplete",
  "critical-risk": "Critical risk",
  "dependency-blocked": "Dependency blocked",
  "decision-overdue": "Decision overdue",
};

export const priorityModules = ["M03", "M10", "M17", "M07", "M04"];