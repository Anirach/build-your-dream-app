// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.
import type { StandardRecord } from "./types";

export const STANDARDS_NOTICE =
  "Demo standards are synthetic paraphrases. Production content will be loaded from the approved JCI whitelist and licensed corpus.";

export const SYNTHETIC_LABEL = "Synthetic placeholder - not authoritative";

export const CHAPTERS = [
  "Infection Prevention (demo chapter)",
  "Medication Safety (demo chapter)",
  "Staff Competency (demo chapter)",
  "Facility Safety (demo chapter)",
  "Quality Governance (demo chapter)",
  "Emergency Preparedness (demo chapter)",
];

const mk = (
  id: string,
  chapter: string,
  title: string,
  paraphrase: string,
  modules: string[],
  keywords: string[],
  relevance: number,
  crosswalk = true,
  classification: StandardRecord["classification"] = "Standard",
): StandardRecord => ({
  id,
  chapter,
  title,
  paraphrase,
  classification,
  language: "English",
  crosswalk,
  relatedModules: modules,
  relevance,
  keywords,
  matchReasons: ["keyword", "semantic"],
  measurableElements: [
    { id: `${id}.ME1`, text: "A documented process exists and is approved by leadership (synthetic)." },
    { id: `${id}.ME2`, text: "Records demonstrate the process is applied consistently (synthetic)." },
    { id: `${id}.ME3`, text: "Findings are reviewed and corrective action is tracked (synthetic)." },
  ],
});

export const standards: StandardRecord[] = [
  mk("DEMO-JCI-001", CHAPTERS[4]!, "Governance of clinical quality programme", "The organisation maintains a documented quality programme with defined leadership accountability (synthetic paraphrase).", ["M01", "M15"], ["governance", "quality", "leadership"], 0.72),
  mk("DEMO-JCI-002", CHAPTERS[2]!, "Clinical handover documentation", "Clinical handover between shifts is documented using a standard structure (synthetic paraphrase).", ["M03", "M06"], ["handover", "nursing", "icu"], 0.81),
  mk("DEMO-JCI-005", CHAPTERS[0]!, "Infection prevention programme scope", "An infection prevention programme covers surveillance, prevention and reporting across all care areas (synthetic paraphrase).", ["M04", "M18"], ["infection", "prevention", "surveillance"], 0.9),
  mk("DEMO-JCI-008", CHAPTERS[0]!, "Hand hygiene monitoring", "Hand hygiene compliance is monitored and results are reported to clinical leadership (synthetic paraphrase).", ["M04"], ["hand hygiene", "audit", "infection"], 0.87),
  mk("DEMO-JCI-011", CHAPTERS[5]!, "Emergency preparedness planning", "An emergency preparedness plan is tested and lessons are documented (synthetic paraphrase).", ["M08", "M17"], ["emergency", "preparedness", "drill"], 0.78),
  mk("DEMO-JCI-014", CHAPTERS[2]!, "Critical-care staff competency evidence", "Staff providing critical care hold documented, current competency evidence for their assigned duties (synthetic paraphrase).", ["M03", "M07"], ["competency", "staff", "icu", "evidence"], 0.94),
  mk("DEMO-JCI-019", CHAPTERS[0]!, "Infection surveillance escalation", "Surveillance findings above defined thresholds are escalated within a defined time (synthetic paraphrase).", ["M03", "M04"], ["surveillance", "escalation", "infection"], 0.83),
  mk("DEMO-JCI-023", CHAPTERS[1]!, "Medication storage controls", "Medications are stored under controlled and monitored conditions (synthetic paraphrase).", ["M05"], ["medication", "storage", "controls"], 0.7),
  mk("DEMO-JCI-027", CHAPTERS[1]!, "High-alert medication double-check", "High-alert medications require an independent second verification that is documented (synthetic paraphrase).", ["M03", "M05"], ["medication", "high-alert", "double-check", "icu"], 0.95),
  mk("DEMO-JCI-031", CHAPTERS[1]!, "Medication reconciliation records", "Medication reconciliation is completed and recorded at defined transition points (synthetic paraphrase).", ["M05", "M24"], ["medication", "reconciliation"], 0.68),
  mk("DEMO-JCI-033", CHAPTERS[5]!, "Emergency equipment readiness", "Emergency equipment is checked on a defined schedule and readiness is recorded (synthetic paraphrase).", ["M03", "M08"], ["emergency", "equipment", "readiness", "log"], 0.86),
  mk("DEMO-JCI-037", CHAPTERS[3]!, "Fire safety systems verification", "Fire detection and suppression systems are verified and defects tracked to closure (synthetic paraphrase).", ["M17"], ["fire", "facility", "safety"], 0.64, false),
  mk("DEMO-JCI-041", CHAPTERS[0]!, "Isolation-room environmental monitoring", "Isolation rooms are monitored for required environmental parameters and records retained (synthetic paraphrase).", ["M03", "M04"], ["isolation", "environmental", "monitoring", "icu"], 0.92),
  mk("DEMO-JCI-044", CHAPTERS[4]!, "Quality indicator data validity", "Quality indicator data is validated before it is used for decisions (synthetic paraphrase).", ["M13", "M15"], ["quality", "data", "validation"], 0.61),
  mk("DEMO-JCI-047", CHAPTERS[2]!, "Orientation and role-specific training", "Staff receive documented orientation and role-specific training before independent practice (synthetic paraphrase).", ["M07", "M28"], ["training", "orientation", "competency"], 0.75),
  mk("DEMO-JCI-052", CHAPTERS[1]!, "Sedation monitoring competency", "Staff performing sedation monitoring hold documented competency attestation (synthetic paraphrase).", ["M03", "M22"], ["sedation", "monitoring", "competency"], 0.79),
  mk("DEMO-JCI-056", CHAPTERS[3]!, "Medical equipment inspection records", "Medical equipment is inspected, tested and maintained with retained records (synthetic paraphrase).", ["M11", "M19"], ["equipment", "inspection", "maintenance"], 0.66),
  mk("DEMO-JCI-061", CHAPTERS[4]!, "Patient safety event reporting", "Patient safety events are reported, analysed and used for improvement (synthetic paraphrase).", ["M15", "M16"], ["safety", "reporting", "improvement"], 0.69),
  mk("DEMO-DGHS-003", CHAPTERS[3]!, "Ventilator maintenance schedule (local overlay)", "Life-support equipment follows a documented preventive maintenance schedule (synthetic paraphrase of a local overlay requirement).", ["M03", "M11"], ["ventilator", "maintenance", "overlay"], 0.74, false),
  mk("DEMO-DGHS-007", CHAPTERS[0]!, "Biomedical waste segregation (local overlay)", "Biomedical waste is segregated, stored and transferred under a documented procedure (synthetic paraphrase of a local overlay requirement).", ["M26"], ["waste", "segregation", "overlay"], 0.6, false),
  mk("DEMO-DGHS-012", CHAPTERS[2]!, "Nursing establishment records (local overlay)", "Nursing establishment and shift coverage are documented against an approved plan (synthetic paraphrase of a local overlay requirement).", ["M06"], ["nursing", "staffing", "overlay"], 0.58, false),
  mk("DEMO-JCI-064", CHAPTERS[5]!, "Utility failure contingency", "Contingency arrangements for utility failure are documented and tested (synthetic paraphrase).", ["M10", "M17"], ["utility", "contingency", "facility"], 0.63, true, "Measurable element"),
];

export const QUICK_SEARCHES = [
  "Infection prevention surveillance",
  "ICU medication safety",
  "Staff competency evidence",
  "Emergency preparedness",
];

export function searchStandards(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return standards;
  return standards
    .filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.paraphrase.toLowerCase().includes(q) ||
        s.chapter.toLowerCase().includes(q) ||
        s.keywords.some((k) => q.includes(k) || k.includes(q)),
    )
    .sort((a, b) => b.relevance - a.relevance);
}

export function standardById(id: string) {
  return standards.find((s) => s.id === id);
}