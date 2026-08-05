// Concept-only presentation model. No licensed JCI text is present or invented.
// Chapter codes are neutral placeholders; all metrics are honest zeros.

export interface CorpusUnit {
  code: string;
  title: string;
  expectedIds: number;
  receivedIds: number;
  edition: string;
  state: "Not received";
}

function chapter(n: number, title: string, expectedIds: number): CorpusUnit {
  return {
    code: `CH-${String(n).padStart(2, "0")}`,
    title,
    expectedIds,
    receivedIds: 0,
    edition: "Edition pending confirmation",
    state: "Not received",
  };
}

export const corpusManifest: CorpusUnit[] = [
  chapter(1, "Placeholder chapter - governance and leadership", 18),
  chapter(2, "Placeholder chapter - patient-centred care", 16),
  chapter(3, "Placeholder chapter - assessment of patients", 15),
  chapter(4, "Placeholder chapter - care of patients", 17),
  chapter(5, "Placeholder chapter - anaesthesia and surgery", 14),
  chapter(6, "Placeholder chapter - medication management", 16),
  chapter(7, "Placeholder chapter - patient and family education", 9),
  chapter(8, "Placeholder chapter - quality improvement", 15),
  chapter(9, "Placeholder chapter - prevention and control of infection", 16),
  chapter(10, "Placeholder chapter - facility management and safety", 18),
  chapter(11, "Placeholder chapter - staff qualifications and education", 14),
  chapter(12, "Placeholder chapter - management of information", 13),
  chapter(13, "Placeholder chapter - access to care and continuity", 12),
  chapter(14, "Placeholder chapter - patient rights", 11),
  chapter(15, "Placeholder chapter - laboratory and diagnostic services", 12),
  chapter(16, "Placeholder chapter - emergency and critical care", 13),
  chapter(17, "Placeholder chapter - medical records and coding", 10),
  chapter(18, "Placeholder chapter - governance of clinical programmes", 9),
  {
    code: "APP-A",
    title: "Placeholder appendix - measurable element index",
    expectedIds: 6,
    receivedIds: 0,
    edition: "Edition pending confirmation",
    state: "Not received",
  },
  {
    code: "APP-B",
    title: "Placeholder appendix - crosswalk reference",
    expectedIds: 8,
    receivedIds: 0,
    edition: "Edition pending confirmation",
    state: "Not received",
  },
];

export const corpusSummary = {
  expectedUnits: 20,
  receivedUnits: 0,
  verifiedIds: 0,
  requiredIds: 262,
  unknownIds: "Not assessed",
  crosswalkCoverage: "Not assessed",
  fullTextGate: "Decision pending (OD-B)",
  placeholderRecords: 22,
};

export interface CitationCheckRow {
  id: string;
  citation: string;
  outcome:
    | "Allowed"
    | "Unknown ID quarantined"
    | "Malformed citation rejected"
    | "Missing source version blocked"
    | "Corrected - ready for revalidation";
  rule: string;
  detail: string;
  raisedBy: string;
  at: string;
}

/** Interaction demonstration only - no production corpus loaded. */
export const citationChecks: CitationCheckRow[] = [
  {
    id: "CIT-01",
    citation: "PLACEHOLDER.01.1",
    outcome: "Allowed",
    rule: "Identifier present in the approved whitelist",
    detail: "Illustrative allowed identifier from the synthetic placeholder set.",
    raisedBy: "Mapping agent (simulated)",
    at: "4 Aug 2026, 14:02",
  },
  {
    id: "CIT-02",
    citation: "PLACEHOLDER.99.9",
    outcome: "Unknown ID quarantined",
    rule: "Only approved whitelist identifiers may be cited in production outputs",
    detail: "Identifier is not in valid_ids. Output held in quarantine and never published.",
    raisedBy: "Mapping agent (simulated)",
    at: "4 Aug 2026, 14:03",
  },
  {
    id: "CIT-03",
    citation: "PLCHLDR-1..2",
    outcome: "Malformed citation rejected",
    rule: "Citation must match the approved identifier pattern",
    detail: "Malformed separator. Row rejected at validation; no reviewer decision accepted.",
    raisedBy: "Mapping agent (simulated)",
    at: "4 Aug 2026, 14:05",
  },
  {
    id: "CIT-04",
    citation: "PLACEHOLDER.04.2",
    outcome: "Missing source version blocked",
    rule: "Every citation must carry the corpus manifest version it was drawn from",
    detail: "Source version absent because no production manifest is loaded.",
    raisedBy: "Validation service (simulated)",
    at: "4 Aug 2026, 14:07",
  },
  {
    id: "CIT-05",
    citation: "PLACEHOLDER.06.3",
    outcome: "Corrected - ready for revalidation",
    rule: "Corrections re-enter validation; they never bypass the gate",
    detail: "Reviewer corrected the identifier. Revalidation requires a production corpus.",
    raisedBy: "Dr Farhana Kabir",
    at: "4 Aug 2026, 15:20",
  },
];

export interface ModelRegistryRow {
  id: string;
  model: string;
  configuration: string;
  version: string;
  approved: "Not approved" | "Approved";
  owner: string;
  changeReason: string;
}

export const modelRegistry: ModelRegistryRow[] = [
  {
    id: "MR-001",
    model: "Placeholder embedding model A",
    configuration: "pgvector cosine, top-k 5, chunk 800 (placeholder)",
    version: "cfg-0.1-placeholder",
    approved: "Not approved",
    owner: "Nadia Rahman",
    changeReason: "Initial placeholder entry for planning only",
  },
  {
    id: "MR-002",
    model: "Placeholder embedding model B",
    configuration: "Hybrid full-text + vector, top-k 5 (placeholder)",
    version: "cfg-0.2-placeholder",
    approved: "Not approved",
    owner: "Nadia Rahman",
    changeReason: "Comparison candidate recorded for Sprint 2 planning",
  },
  {
    id: "MR-003",
    model: "Placeholder reranker",
    configuration: "Rerank top-20 to top-5 (placeholder)",
    version: "cfg-0.1-placeholder",
    approved: "Not approved",
    owner: "Tanvir Alam",
    changeReason: "Not assessed; requires approved architecture",
  },
];

export const retrievalEvaluation = {
  fixedSetAvailable: 0,
  fixedSetRequired: 100,
  completedQueries: 0,
  topFive: "Not run",
  gateThreshold: ">= 85%",
  lastRun: "None",
  rerunTriggers: [
    "Embedding model change",
    "Indexing or chunking change",
    "Corpus version change",
    "Retrieval parameter change",
  ],
  disabledReason: "Production corpus and fixed 100-query set are required",
};

export function citationTone(outcome: CitationCheckRow["outcome"]) {
  switch (outcome) {
    case "Allowed":
      return "success" as const;
    case "Corrected - ready for revalidation":
      return "info" as const;
    case "Missing source version blocked":
    case "Unknown ID quarantined":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}