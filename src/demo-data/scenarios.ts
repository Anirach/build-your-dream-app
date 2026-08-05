// Concept-only presentation model. Deterministic synthetic projection used by
// the Gap analysis scenario runner. Replace through adapters once the
// owner-approved PostgreSQL schema and APIs are available.
import type { GapAnalysisSummary, GapMatrixRowView } from "./types";

export type EvidenceState = GapMatrixRowView["state"];

export interface ScenarioLevers {
  /** Extra synthetic evidence documents assumed to be supplied. */
  extraDocuments: number;
  /** Accept unverified evidence after an owner attestation walk-through. */
  ownerAttestation: boolean;
  /** Re-sample partial rows over a further two weeks. */
  resample: boolean;
  /** Evidence acceptance strictness applied by the reviewer. */
  strictness: "Lenient" | "Standard" | "Strict";
}

export const defaultLevers: ScenarioLevers = {
  extraDocuments: 0,
  ownerAttestation: false,
  resample: false,
  strictness: "Standard",
};

export interface ScenarioCounts {
  present: number;
  unverified: number;
  partial: number;
  absent: number;
  total: number;
}

export interface GapScenario {
  id: string;
  matrixId: string;
  matrixName: string;
  name: string;
  levers: ScenarioLevers;
  counts: ScenarioCounts;
  /** Weighted coverage score, 0-100. */
  coverage: number;
  /** Rows still requiring new evidence before Gate 1. */
  blockers: number;
  effort: number;
  createdAt: string;
  runId: string;
  note: string;
}

const order: EvidenceState[] = ["Absent", "Partial", "Present - unverified", "Present"];

/** Deterministic per-row projection. No randomness, so runs are repeatable. */
export function projectRowState(
  row: GapMatrixRowView,
  levers: ScenarioLevers,
  index: number,
): EvidenceState {
  let rank = order.indexOf(row.state);

  // Extra documents lift the weakest rows first, cycling deterministically.
  if (levers.extraDocuments > 0 && rank < 3 && index < levers.extraDocuments * 2) {
    rank += index % 2 === 0 ? 2 : 1;
  }

  if (levers.resample && row.state === "Partial" && row.confidence >= 0.8) rank = 3;

  if (levers.ownerAttestation && row.state === "Present - unverified") rank = 3;

  if (levers.strictness === "Strict") {
    if (row.confidence < 0.75) rank = Math.min(rank, 1);
    if (rank === 2) rank = 1;
  }
  if (levers.strictness === "Lenient" && rank === 1 && row.confidence >= 0.85) rank = 2;

  return order[Math.max(0, Math.min(3, rank))]!;
}

export function projectMatrix(analysis: GapAnalysisSummary, levers: ScenarioLevers) {
  const rows = analysis.rows.map((row, i) => ({
    row,
    from: row.state,
    to: projectRowState(row, levers, i),
  }));

  const counts: ScenarioCounts = {
    present: rows.filter((r) => r.to === "Present").length,
    unverified: rows.filter((r) => r.to === "Present - unverified").length,
    partial: rows.filter((r) => r.to === "Partial").length,
    absent: rows.filter((r) => r.to === "Absent").length,
    total: rows.length,
  };

  const coverage =
    counts.total === 0
      ? 0
      : Math.round(
          ((counts.present * 1 + counts.unverified * 0.6 + counts.partial * 0.45) / counts.total) *
            1000,
        ) / 10;

  const blockers = counts.absent + counts.partial;
  const effort =
    levers.extraDocuments * 3 +
    (levers.ownerAttestation ? 4 : 0) +
    (levers.resample ? 6 : 0) +
    (levers.strictness === "Strict" ? 5 : 0);

  return { rows, counts, coverage, blockers, effort };
}

export function leverSummary(levers: ScenarioLevers) {
  const parts = [`${levers.strictness} strictness`];
  if (levers.extraDocuments > 0) parts.push(`+${levers.extraDocuments} documents`);
  if (levers.ownerAttestation) parts.push("owner attestation");
  if (levers.resample) parts.push("two-week re-sample");
  return parts.join(" · ");
}
