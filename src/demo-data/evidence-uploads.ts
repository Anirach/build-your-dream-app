// Evidence upload model for the Input and Evidence Register.
// Concept-only: files are held in the browser session for this mockup and are
// never transmitted or stored. A production backend must validate MIME type,
// run malware scanning, enforce size limits, compute a real checksum and apply
// classification and retention rules before accepting any file.
import type { DocumentLevel, EvidenceState } from "./evidence-register";

export type AttachmentKind =
  | "Authoritative document"
  | "Supporting extract"
  | "Run output / log"
  | "Signed approval"
  | "Correspondence";

export const attachmentKinds: AttachmentKind[] = [
  "Authoritative document",
  "Supporting extract",
  "Run output / log",
  "Signed approval",
  "Correspondence",
];

export interface EvidenceAttachment {
  id: string;
  artifactId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: AttachmentKind;
  /** State the artifact was placed in when this file was attached. */
  linkedState: EvidenceState;
  /** Document level of the artifact at attachment time. */
  linkedLevel: DocumentLevel;
  /** Reference (path, ticket, document ID) this file evidences. */
  reference: string;
  note: string;
  uploadedBy: string;
  uploadedAt: string;
  /** Session-local placeholder digest. Not a cryptographic checksum. */
  checksum: string;
  /** Session-only object URL for preview; not persisted. */
  previewUrl?: string;
  /** Stable lineage identifier shared by every revision of the same evidence slot. */
  lineageId: string;
  /** 1-based revision number within the lineage. */
  revision: number;
  /** Current revision, or superseded by a later re-upload. */
  status: "Current" | "Superseded";
  /** Attachment id this revision replaced, when it is not the first revision. */
  supersedesId?: string;
  /** Attachment id that replaced this revision, once superseded. */
  supersededById?: string;
}

/**
 * Identity of an evidence slot: same artifact, linked state and reference means a
 * re-upload is a new revision of the same evidence rather than a separate file.
 */
export function lineageKey(input: {
  artifactId: string;
  linkedState: EvidenceState;
  reference: string;
}) {
  return `${input.artifactId}::${input.linkedState}::${(input.reference || "Not recorded")
    .trim()
    .toLowerCase()}`;
}

/** Groups attachments into lineages, newest revision first inside each group. */
export function groupByLineage(attachments: EvidenceAttachment[]) {
  const groups = new Map<string, EvidenceAttachment[]>();
  for (const a of attachments) {
    const list = groups.get(a.lineageId) ?? [];
    list.push(a);
    groups.set(a.lineageId, list);
  }
  return [...groups.values()]
    .map((list) => [...list].sort((x, y) => y.revision - x.revision))
    .sort((x, y) => (y[0]!.uploadedAt < x[0]!.uploadedAt ? -1 : 1));
}

/** Extensions accepted by the register in this mockup. */
export const allowedExtensions = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "txt",
  "md",
  "json",
  "sql",
  "log",
  "zip",
];

export const maxUploadBytes = 20 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function fileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : "";
}

/** Returns a human-readable rejection reason, or null when the file is accepted. */
export function validateEvidenceFile(file: { name: string; size: number }) {
  const ext = fileExtension(file.name);
  if (!ext) return "File has no extension so its type cannot be established.";
  if (!allowedExtensions.includes(ext)) {
    return `Files of type .${ext} are not accepted. Allowed: ${allowedExtensions.join(", ")}.`;
  }
  if (file.size === 0) return "File is empty (0 bytes).";
  if (file.size > maxUploadBytes) {
    return `File is ${formatBytes(file.size)}; the limit is ${formatBytes(maxUploadBytes)}.`;
  }
  return null;
}

/**
 * Deterministic placeholder digest derived from name, size and sequence.
 * Presentation only - a real upload must hash the file contents server-side.
 */
export function placeholderChecksum(fileName: string, sizeBytes: number, seq: number) {
  let hash = 0x811c9dc5;
  const input = `${fileName}:${sizeBytes}:${seq}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const digest = hash.toString(16).padStart(8, "0").repeat(4).slice(0, 32);
  return `sha256-session:${digest}`;
}
