// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.
import type { AgentRunSummary, MappingRowView } from "./types";

export const sampleSops = [
  "ICU Medication Management SOP v0.3 - Synthetic",
  "Hand Hygiene Monitoring SOP v0.2 - Synthetic",
  "Critical Care Competency SOP v0.1 - Synthetic",
];

export const demoModel = "local-mistral-demo-ref (Demo)";

export const mappingRun: AgentRunSummary = {
  id: "RUN-2026-0814-A",
  sop: sampleSops[0]!,
  moduleCode: "M03",
  created: "4 Aug 2026, 16:40",
  status: "DRAFT",
  model: demoModel,
  promptHash: "sha256:4f19c2a8...e701",
  inputDocument: "SYN-DOC-0442 (synthetic sample)",
  clauses: 30,
  mapped: 24,
  noMatch: 6,
  lowConfidence: 4,
  invalidCitations: 0,
};

export const recentRuns: AgentRunSummary[] = [
  mappingRun,
  {
    ...mappingRun,
    id: "RUN-2026-0731-B",
    sop: sampleSops[1]!,
    moduleCode: "M04",
    created: "31 Jul 2026, 11:05",
    status: "In review",
    clauses: 18,
    mapped: 15,
    noMatch: 3,
    lowConfidence: 2,
  },
  {
    ...mappingRun,
    id: "RUN-2026-0724-C",
    sop: sampleSops[2]!,
    moduleCode: "M07",
    created: "24 Jul 2026, 09:22",
    status: "Approved",
    clauses: 22,
    mapped: 20,
    noMatch: 2,
    lowConfidence: 1,
  },
];

const clauseTopics: {
  text: string;
  standard: string | null;
  confidence: number;
  phrases: string[];
}[] = [
  { text: "Defines the purpose and scope of medication management within the critical care unit.", standard: "DEMO-JCI-023", confidence: 0.88, phrases: ["purpose and scope", "critical care unit"] },
  { text: "Requires an approved list of high-alert medications to be maintained by pharmacy.", standard: "DEMO-JCI-027", confidence: 0.93, phrases: ["high-alert medications", "approved list"] },
  { text: "Requires an independent second check before administration of high-alert medications.", standard: "DEMO-JCI-027", confidence: 0.96, phrases: ["independent second check", "before administration"] },
  { text: "Specifies that the second check is recorded in the administration record.", standard: "DEMO-JCI-027", confidence: 0.9, phrases: ["recorded", "administration record"] },
  { text: "Describes storage conditions and temperature monitoring for controlled medications.", standard: "DEMO-JCI-023", confidence: 0.86, phrases: ["storage conditions", "temperature monitoring"] },
  { text: "States that stock rotation checks occur weekly with a signed record.", standard: "DEMO-JCI-023", confidence: 0.71, phrases: ["stock rotation", "signed record"] },
  { text: "Assigns responsibility for medication reconciliation on unit transfer.", standard: "DEMO-JCI-031", confidence: 0.82, phrases: ["medication reconciliation", "unit transfer"] },
  { text: "Requires documented staff competency before independent medication administration.", standard: "DEMO-JCI-014", confidence: 0.91, phrases: ["documented staff competency", "independent medication administration"] },
  { text: "Describes the annual refresher training cycle for critical care nurses.", standard: "DEMO-JCI-047", confidence: 0.79, phrases: ["annual refresher training"] },
  { text: "Sets out escalation steps when a medication error is suspected.", standard: "DEMO-JCI-061", confidence: 0.84, phrases: ["escalation steps", "medication error"] },
  { text: "Requires medication incidents to be analysed monthly by the unit committee.", standard: "DEMO-JCI-061", confidence: 0.77, phrases: ["analysed monthly", "unit committee"] },
  { text: "States that infusion pumps are checked before each shift.", standard: "DEMO-JCI-056", confidence: 0.73, phrases: ["infusion pumps", "before each shift"] },
  { text: "Describes local labelling conventions for prepared infusions.", standard: null, confidence: 0.41, phrases: ["labelling conventions", "prepared infusions"] },
  { text: "Requires sedation infusion monitoring by an attested practitioner.", standard: "DEMO-JCI-052", confidence: 0.89, phrases: ["sedation infusion monitoring", "attested practitioner"] },
  { text: "Specifies documentation of sedation depth at defined intervals.", standard: "DEMO-JCI-052", confidence: 0.81, phrases: ["sedation depth", "defined intervals"] },
  { text: "Sets out how emergency medication trays are sealed and verified.", standard: "DEMO-JCI-033", confidence: 0.87, phrases: ["emergency medication trays", "sealed and verified"] },
  { text: "Requires the emergency tray check log to be retained for review.", standard: "DEMO-JCI-033", confidence: 0.85, phrases: ["check log", "retained for review"] },
  { text: "Describes internal unit notice board arrangements for shift messages.", standard: null, confidence: 0.28, phrases: ["notice board", "shift messages"] },
  { text: "Requires ventilated patients' medication interactions to be reviewed daily.", standard: "DEMO-DGHS-003", confidence: 0.63, phrases: ["ventilated patients", "reviewed daily"] },
  { text: "Specifies hand hygiene before medication preparation.", standard: "DEMO-JCI-008", confidence: 0.9, phrases: ["hand hygiene", "medication preparation"] },
  { text: "Requires isolation-room medication handling precautions.", standard: "DEMO-JCI-041", confidence: 0.8, phrases: ["isolation-room", "precautions"] },
  { text: "Describes cleaning of the medication preparation surface between uses.", standard: "DEMO-JCI-005", confidence: 0.68, phrases: ["cleaning", "preparation surface"] },
  { text: "States that surveillance findings involving medication are escalated to IPC.", standard: "DEMO-JCI-019", confidence: 0.76, phrases: ["surveillance findings", "escalated to IPC"] },
  { text: "Describes stationery ordering for the unit medication room.", standard: null, confidence: 0.19, phrases: ["stationery ordering"] },
  { text: "Requires clinical handover to include active infusions.", standard: "DEMO-JCI-002", confidence: 0.83, phrases: ["clinical handover", "active infusions"] },
  { text: "Specifies that handover uses the standard structured form.", standard: "DEMO-JCI-002", confidence: 0.87, phrases: ["structured form"] },
  { text: "Describes the unit's tea-break rota arrangement.", standard: null, confidence: 0.12, phrases: ["tea-break rota"] },
  { text: "Requires quarterly audit of medication documentation completeness.", standard: "DEMO-JCI-044", confidence: 0.64, phrases: ["quarterly audit", "documentation completeness"] },
  { text: "States that audit results feed the unit quality improvement plan.", standard: "DEMO-JCI-044", confidence: 0.59, phrases: ["audit results", "quality improvement plan"] },
  { text: "Describes the local numbering convention for SOP appendices.", standard: null, confidence: 0.22, phrases: ["numbering convention", "appendices"] },
];

export const mappingRows: MappingRowView[] = clauseTopics.map((t, i) => ({
  id: `${mappingRun.id}-C${String(i + 1).padStart(2, "0")}`,
  clauseNo: i + 1,
  clausePreview: t.text.length > 82 ? `${t.text.slice(0, 82)}...` : t.text,
  clauseFull: `${i + 1}. ${t.text} This synthetic clause text stands in for the approved SOP content and carries no clinical authority.`,
  sourceRef: `SYN-DOC-0442, section ${Math.ceil((i + 1) / 4)}, p.${Math.ceil((i + 1) / 3)}`,
  keyPhrases: t.phrases,
  standardId: t.standard,
  measurableElement: t.standard ? `${t.standard}.ME${(i % 3) + 1}` : null,
  confidence: t.confidence,
  citationValid: t.standard !== null,
  rationale: t.standard
    ? `Clause language aligns with the synthetic paraphrase for ${t.standard}. Match driven by the phrases ${t.phrases.map((p) => `"${p}"`).join(" and ")}.`
    : "No placeholder standard in the demo whitelist covers this clause. A human reviewer must decide whether a mapping is required.",
  reviewStatus: "Not reviewed",
}));

export function confidenceBand(c: number): "High" | "Medium" | "Low" {
  if (c >= 0.85) return "High";
  if (c >= 0.65) return "Medium";
  return "Low";
}