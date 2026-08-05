// Two-step evidence rollback workflow (concept-only presentation model).
// A holder of evidence.rollback raises a request; a Programme Management Office
// approver (evidence.rollback.approve) must confirm before the earlier revision
// becomes current. Nothing is applied at request time.
import type { RoleId } from "./types";

export type RollbackRequestStatus = "Pending approval" | "Approved" | "Rejected";

export interface EvidenceRollbackRequest {
  id: string;
  /** Superseded attachment that would become current again. */
  attachmentId: string;
  artifactId: string;
  lineageId: string;
  revision: number;
  fileName: string;
  /** Revision that is current at request time, for the reviewer's context. */
  currentAttachmentId?: string;
  currentRevision?: number;
  reason: string;
  requestedBy: string;
  requestedByRole: RoleId;
  requestedAt: string;
  status: RollbackRequestStatus;
  decidedBy?: string;
  decidedByRole?: RoleId;
  decidedAt?: string;
  decisionNote?: string;
}

export function pendingRequestFor(
  requests: EvidenceRollbackRequest[],
  attachmentId: string,
) {
  return requests.find(
    (r) => r.attachmentId === attachmentId && r.status === "Pending approval",
  );
}

export function pendingRequestForLineage(
  requests: EvidenceRollbackRequest[],
  lineageId: string,
) {
  return requests.find((r) => r.lineageId === lineageId && r.status === "Pending approval");
}

export function requestsForArtifact(
  requests: EvidenceRollbackRequest[],
  artifactId: string,
) {
  return requests.filter((r) => r.artifactId === artifactId);
}
