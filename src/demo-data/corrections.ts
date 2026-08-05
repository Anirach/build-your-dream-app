// Concept-only presentation model. Multi-step correction workflow: a correction
// is never applied by a single actor. It is requested, countersigned by a
// reviewer who did not raise it, then applied as a reversal on the audit trail.
import { baselineSignOffRules, type SignOffRule } from "./signoff-rules";

export type CorrectionStatus =
  | "Awaiting sign-off"
  | "Signed off"
  | "Applied"
  | "Rejected";

export interface CorrectionStep {
  stage: "Requested" | "Sign-off" | "Applied" | "Rejected";
  actor: string;
  role: string;
  at: string;
  note: string;
}

export interface CorrectionSignOff {
  actor: string;
  role: string;
  at: string;
  note: string;
}

export interface CorrectionRequest {
  id: string;
  objectRef: string;
  objectType: string;
  /** Mandate type that decides which sign-off rule applies. */
  mandateType: string;
  /** Rule snapshot taken when the request was raised. */
  rule: SignOffRule;
  traceId: string;
  proposedChange: string;
  reason: string;
  status: CorrectionStatus;
  requestedBy: string;
  requestedAt: string;
  signOffs: CorrectionSignOff[];
  signedOffBy?: string;
  appliedBy?: string;
  history: CorrectionStep[];
}

/** Ordered workflow definition rendered as a stepper in the UI. */
export const correctionStages = [
  {
    key: "Requested" as const,
    label: "Requested",
    help: "Any mandate with correction rights raises the request with a reason and the proposed change.",
  },
  {
    key: "Sign-off" as const,
    label: "Reviewer sign-off",
    help: "The mandate's configured rule decides how many countersignatures are needed and which roles may give them.",
  },
  {
    key: "Applied" as const,
    label: "Applied by reversal",
    help: "Only after sign-off is the reversing entry appended to the append-only trail.",
  },
];

export const statusTone: Record<
  CorrectionStatus,
  "info" | "warning" | "success" | "danger" | "neutral"
> = {
  "Awaiting sign-off": "warning",
  "Signed off": "info",
  Applied: "success",
  Rejected: "danger",
};

/** Index of the stage a request has reached, for the stepper. */
export function stageIndex(status: CorrectionStatus) {
  if (status === "Awaiting sign-off") return 0;
  if (status === "Signed off") return 1;
  return 2;
}

/** Seeded synthetic requests so the queue is never empty on first load. */
export const seedCorrectionRequests: CorrectionRequest[] = [
  {
    id: "COR-0041",
    objectRef: "EFF-2291",
    objectType: "Effort entry",
    mandateType: "Effort entry",
    rule: baselineSignOffRules()["Effort entry"],
    traceId: "trc-7ed220",
    proposedChange: "Reassign 6.0 man-days from M07 to M03 (ICU readiness)",
    reason: "Effort booked against the wrong module during the week 31 sync.",
    status: "Awaiting sign-off",
    requestedBy: "Nabila Chowdhury",
    requestedAt: "3 Aug 2026, 16:40",
    signOffs: [],
    history: [
      {
        stage: "Requested",
        actor: "Nabila Chowdhury",
        role: "Programme Owner / PMO Lead",
        at: "3 Aug 2026, 16:40",
        note: "Raised after the weekly effort reconciliation.",
      },
    ],
  },
  {
    id: "COR-0040",
    objectRef: "AUD-1904",
    objectType: "Audit event",
    mandateType: "Audit event",
    rule: baselineSignOffRules()["Audit event"],
    traceId: "trc-91b3f0",
    proposedChange: "Restate the recorded owner attestation date",
    reason: "Attestation was logged a day early by the weekly sync.",
    status: "Signed off",
    requestedBy: "Dr. Arif Hasan",
    requestedAt: "31 Jul 2026, 09:15",
    signOffs: [
      {
        actor: "Dr. Maya Rahman",
        role: "Clinical / Quality Reviewer",
        at: "31 Jul 2026, 10:02",
        note: "Sign-off 1 of 2: attestation email confirms the later date.",
      },
      {
        actor: "Farhana Islam",
        role: "Independent Auditor",
        at: "31 Jul 2026, 12:40",
        note: "Sign-off 2 of 2: rule for audit events satisfied.",
      },
    ],
    signedOffBy: "Farhana Islam",
    history: [
      {
        stage: "Requested",
        actor: "Dr. Arif Hasan",
        role: "Module Lead",
        at: "31 Jul 2026, 09:15",
        note: "Attestation date mismatch found during module review.",
      },
      {
        stage: "Sign-off",
        actor: "Dr. Maya Rahman",
        role: "Clinical / Quality Reviewer",
        at: "31 Jul 2026, 10:02",
        note: "Sign-off 1 of 2 recorded.",
      },
      {
        stage: "Sign-off",
        actor: "Farhana Islam",
        role: "Independent Auditor",
        at: "31 Jul 2026, 12:40",
        note: "Sign-off 2 of 2 recorded; ready to apply.",
      },
    ],
  },
  {
    id: "COR-0039",
    objectRef: "MAP-0114",
    objectType: "Mapping row",
    mandateType: "Mapping row",
    rule: baselineSignOffRules()["Mapping row"],
    traceId: "trc-4a91c8",
    proposedChange: "Restate the clause mapping to the correct measurable element",
    reason: "Agent draft cited a superseded measurable element.",
    status: "Applied",
    requestedBy: "Dr. Arif Hasan",
    requestedAt: "29 Jul 2026, 10:05",
    signOffs: [
      {
        actor: "Dr. Maya Rahman",
        role: "Clinical / Quality Reviewer",
        at: "29 Jul 2026, 11:22",
        note: "Sign-off: proposed restatement matches the current standard text.",
      },
    ],
    signedOffBy: "Dr. Maya Rahman",
    appliedBy: "Nabila Chowdhury",
    history: [
      {
        stage: "Requested",
        actor: "Dr. Arif Hasan",
        role: "Module Lead",
        at: "29 Jul 2026, 10:05",
        note: "Superseded citation spotted during module review.",
      },
      {
        stage: "Sign-off",
        actor: "Dr. Maya Rahman",
        role: "Clinical / Quality Reviewer",
        at: "29 Jul 2026, 11:22",
        note: "Sign-off: proposed restatement matches the current standard text.",
      },
      {
        stage: "Applied",
        actor: "Nabila Chowdhury",
        role: "Programme Owner / PMO Lead",
        at: "29 Jul 2026, 11:24",
        note: "Reversal and corrected entry appended under one trace ID.",
      },
    ],
  },
];