// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { seedAuditEvents } from "./audit";
import {
  isGateReady,
  seedEvidenceRegister,
  type EvidenceArtifact,
  type EvidenceState,
} from "./evidence-register";
import {
  placeholderChecksum,
  lineageKey,
  validateEvidenceFile,
  formatBytes,
  type AttachmentKind,
  type EvidenceAttachment,
} from "./evidence-uploads";
import {
  pendingRequestFor,
  pendingRequestForLineage,
  type EvidenceRollbackRequest,
} from "./evidence-rollback";
import {
  activePacket,
  packetById,
  type PacketId,
} from "./readiness";
import { seedReviewPackages, type ReviewPackageView } from "./review-packages";
import {
  seedCorrectionRequests,
  type CorrectionRequest,
} from "./corrections";
import {
  baselineSignOffRules,
  ruleFor,
  ruleSummary,
  type MandateType,
  type SignOffRule,
  type SignOffRuleSet,
} from "./signoff-rules";
import { mappingRows } from "./mapping";
import { gapAnalyses } from "./gaps";
import { reviewQueue } from "./reviews";
import { modules, STAGES } from "./modules";
import {
  countOutcomes,
  datasetFor,
  formFor,
  recordKindLabels,
  seedIntakeRecords,
  seedLedger,
  seedProposals,
  seedReceipts,
  type ImportRowView,
} from "./intake";
import { leverSummary, type GapScenario } from "./scenarios";
import {
  seedIntakeActivity,
  seedIntakeNotifications,
  type IntakeActivityItem,
  type IntakeNotificationView,
} from "./intake-notifications";
import {
  actorFor,
  baselineMatrix,
  denialMessage,
  roleName,
  type Permission,
  type PermissionMatrix,
} from "./permissions";
import type {
  AuditEventView,
  ColumnMappingView,
  IntakeRecordKind,
  IntakeReceiptView,
  LedgerEntryView,
  MappingRowView,
  ModuleSummary,
  ProgrammeRecordDraft,
  RegistryChangeProposalView,
  ReviewQueueItem,
  RoleId,
} from "./types";

export interface ClauseDecision {
  status: MappingRowView["reviewStatus"];
  standardId: string | null;
  reason?: string;
  reviewer: string;
  at: string;
}

export interface PacketAttestation {
  actor: string;
  at: string;
  reason: string;
}

export interface PacketAcceptanceRecord {
  id: string;
  packetId: PacketId;
  packetVersion: string;
  actor: string;
  at: string;
  reason: string;
  evidence: string[];
}

interface DemoState {
  role: RoleId;
  setRole: (role: RoleId) => void;
  /** Simulated session sign-in for the mockup. No real credentials. */
  signedIn: boolean;
  signIn: (role: RoleId) => void;
  signOut: () => void;
  /** Simulated authorisation check for the active role. */
  can: (permission: Permission) => boolean;
  /** Human-readable reason the active role is blocked. */
  denialReason: (permission: Permission) => string;
  actor: string;
  clauseDecisions: Record<string, ClauseDecision>;
  decideClause: (
    row: MappingRowView,
    decision: Omit<ClauseDecision, "reviewer" | "at">,
  ) => boolean;
  reviewCompleted: boolean;
  completeReview: (counts: Record<string, number>) => string | null;
  auditReference: string | null;
  gapRowStatus: Record<string, "Not reviewed" | "Approved" | "Returned">;
  setGapRowStatus: (id: string, status: "Approved" | "Returned", reason?: string) => boolean;
  gapScenarios: GapScenario[];
  saveScenario: (scenario: Omit<GapScenario, "id" | "createdAt" | "runId">) => GapScenario | null;
  deleteScenario: (id: string) => void;
  selectedScenarioId: string | null;
  selectScenario: (id: string) => boolean;
  reviewStatuses: Record<string, ReviewQueueItem["status"]>;
  reassign: (id: string, reviewer: string) => boolean;
  /** Multi-step correction workflow: request -> reviewer sign-off -> apply. */
  correctionRequests: CorrectionRequest[];
  requestCorrection: (input: {
    objectRef: string;
    objectType: string;
    mandateType: MandateType;
    proposedChange: string;
    reason: string;
    traceId: string;
  }) => CorrectionRequest | null;
  signOffCorrection: (id: string, note: string) => boolean;
  rejectCorrection: (id: string, note: string) => boolean;
  applyCorrection: (id: string) => boolean;
  /** Why the active actor cannot act on this request, beyond permissions. */
  correctionBlocker: (request: CorrectionRequest, step: "signoff" | "apply") => string | null;
  /** Configurable reviewer sign-off rules per mandate type. */
  signOffRules: SignOffRuleSet;
  setSignOffRule: (mandateType: MandateType, patch: Partial<SignOffRule>) => boolean;
  resetSignOffRules: () => boolean;
  /** Session-editable permission matrix and actor assignments. */
  permissionMatrix: PermissionMatrix;
  setRolePermission: (role: RoleId, permission: Permission, granted: boolean) => boolean;
  resetRolePermissions: (role: RoleId) => boolean;
  roleAssignments: Record<RoleId, string>;
  assignRoleActor: (role: RoleId, personName: string) => boolean;
  /* ---- Governed data intake and administration ---- */
  /** Registry modules in force for this session, including approved proposals. */
  activeModules: ModuleSummary[];
  moduleByCode: (code: string) => ModuleSummary | undefined;
  intakeRecords: ProgrammeRecordDraft[];
  addIntakeRecord: (input: {
    kind: IntakeRecordKind;
    values: Record<string, string>;
    asDraft: boolean;
  }) => ProgrammeRecordDraft | null;
  correctIntakeRecord: (
    id: string,
    field: string,
    value: string,
    reason: string,
  ) => boolean;
  ledger: LedgerEntryView[];
  addLedgerEntry: (values: Record<string, string>) => LedgerEntryView | null;
  correctLedgerEntry: (
    id: string,
    input: { days: number; workPackage: string; activity: string; reason: string },
  ) => boolean;
  receipts: IntakeReceiptView[];
  commitImport: (input: {
    importType: string;
    sourceName: string;
    reason: string;
    mapping: ColumnMappingView[];
    rows: ImportRowView[];
    acknowledgedWarnings: boolean;
  }) => IntakeReceiptView | null;
  proposals: RegistryChangeProposalView[];
  submitProposal: (
    input: Omit<
      RegistryChangeProposalView,
      "id" | "requestedBy" | "requestedAt" | "status" | "validation"
    > & { validation: RegistryChangeProposalView["validation"] },
  ) => RegistryChangeProposalView | null;
  decideProposal: (id: string, approve: boolean, reason: string) => boolean;
  /** Activity feed for registry proposal reviews and decisions. */
  intakeActivity: IntakeActivityItem[];
  /** Owner and requester notifications raised by proposal events. */
  intakeNotifications: IntakeNotificationView[];
  unreadNotifications: number;
  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;
  /** Nudge the current owner queue for a still-pending proposal. */
  remindProposalOwner: (id: string) => boolean;
  auditEvents: AuditEventView[];
  /* ---- Production readiness centre (concept-only) ---- */
  evidenceRegister: EvidenceArtifact[];
  updateEvidenceState: (
    id: string,
    state: EvidenceState,
    note: string,
    reference?: string,
  ) => boolean;
  /** Session-held evidence files, newest first, keyed by artifact. */
  evidenceAttachments: EvidenceAttachment[];
  attachmentsFor: (artifactId: string) => EvidenceAttachment[];
  attachEvidenceFile: (input: {
    artifactId: string;
    file: File;
    kind: AttachmentKind;
    linkedState: EvidenceState;
    reference: string;
    note: string;
  }) => EvidenceAttachment | null;
  removeEvidenceAttachment: (attachmentId: string, reason: string) => boolean;
  /** Raise a rollback request; a PMO approver must confirm before it applies. */
  requestEvidenceRollback: (attachmentId: string, reason: string) => boolean;
  /** PMO decision on a pending rollback request; approval applies the rollback. */
  decideEvidenceRollback: (requestId: string, approve: boolean, note: string) => boolean;
  /** Session rollback requests, newest first. */
  evidenceRollbackRequests: EvidenceRollbackRequest[];
  requestPacketAttestation: (packetId: PacketId) => boolean;
  packetAttestations: Partial<Record<PacketId, PacketAttestation>>;
  attestPacket: (packetId: PacketId, reason: string) => boolean;
  acceptedPackets: PacketId[];
  acceptanceHistory: PacketAcceptanceRecord[];
  acceptPacket: (packetId: PacketId, reason: string) => boolean;
  /** Ordered, human-readable reasons acceptance is not yet permitted. */
  acceptanceBlockers: (packetId: PacketId) => string[];
  reviewPackages: ReviewPackageView[];
  approveReviewPackage: (id: string, note: string) => boolean;
  resetDemo: () => void;
}

function now() {
  return new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleId>("reviewer");
  const [signedIn, setSignedIn] = useState(false);
  const [clauseDecisions, setClauseDecisions] = useState<Record<string, ClauseDecision>>({});
  const [sessionEvents, setSessionEvents] = useState<AuditEventView[]>([]);
  const [auditReference, setAuditReference] = useState<string | null>(null);
  const [gapRowStatus, setGapRowStatusMap] = useState<Record<string, "Not reviewed" | "Approved" | "Returned">>(
    () =>
      Object.fromEntries(
        gapAnalyses.flatMap((g) => g.rows.map((r) => [r.id, r.reviewStatus] as const)),
      ),
  );
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewQueueItem["status"]>>(
    () => Object.fromEntries(reviewQueue.map((r) => [r.id, r.status] as const)),
  );
  const [seq, setSeq] = useState(2100);
  const [gapScenarios, setGapScenarios] = useState<GapScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenarioSeq, setScenarioSeq] = useState(0);
  const [correctionRequests, setCorrectionRequests] =
    useState<CorrectionRequest[]>(seedCorrectionRequests);
  const [correctionSeq, setCorrectionSeq] = useState(41);
  const [signOffRules, setSignOffRules] = useState<SignOffRuleSet>(baselineSignOffRules);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(baselineMatrix);
  const [roleAssignments, setRoleAssignments] = useState<Record<RoleId, string>>(() =>
    Object.fromEntries(
      (Object.keys(baselineMatrix()) as RoleId[]).map((r) => [r, actorFor(r)] as const),
    ) as Record<RoleId, string>,
  );
  const [activeModules, setActiveModules] = useState<ModuleSummary[]>(modules);
  const [intakeRecords, setIntakeRecords] = useState<ProgrammeRecordDraft[]>(seedIntakeRecords);
  const [intakeSeq, setIntakeSeq] = useState(3);
  const [ledger, setLedger] = useState<LedgerEntryView[]>(seedLedger);
  const [ledgerSeq, setLedgerSeq] = useState(91);
  const [receipts, setReceipts] = useState<IntakeReceiptView[]>(seedReceipts);
  const [receiptSeq, setReceiptSeq] = useState(42);
  const [proposals, setProposals] = useState<RegistryChangeProposalView[]>(seedProposals);
  const [proposalSeq, setProposalSeq] = useState(7);
  const [activityItems, setActivityItems] = useState<IntakeActivityItem[]>([]);
  const [notifications, setNotifications] =
    useState<IntakeNotificationView[]>(seedIntakeNotifications);
  const [notifySeq, setNotifySeq] = useState(3);
  const [activitySeq, setActivitySeq] = useState(7);
  const [evidenceRegister, setEvidenceRegister] =
    useState<EvidenceArtifact[]>(seedEvidenceRegister);
  const [packetAttestations, setPacketAttestations] = useState<
    Partial<Record<PacketId, PacketAttestation>>
  >({});
  const [acceptedPackets, setAcceptedPackets] = useState<PacketId[]>([]);
  const [acceptanceHistory, setAcceptanceHistory] = useState<PacketAcceptanceRecord[]>([]);
  const [reviewPackages, setReviewPackages] =
    useState<ReviewPackageView[]>(seedReviewPackages);
  const [evidenceAttachments, setEvidenceAttachments] = useState<EvidenceAttachment[]>([]);
  const [attachmentSeq, setAttachmentSeq] = useState(1);
  const [rollbackRequests, setRollbackRequests] = useState<EvidenceRollbackRequest[]>([]);
  const [rollbackSeq, setRollbackSeq] = useState(1);

  const actor = roleAssignments[role] ?? actorFor(role);

  const allows = useCallback(
    (permission: Permission) => permissionMatrix[role].includes(permission),
    [permissionMatrix, role],
  );
  const denialReason = useCallback(
    (permission: Permission) => denialMessage(role, permission, permissionMatrix),
    [permissionMatrix, role],
  );

  /** Central authorisation gate: denied attempts are recorded, never applied. */
  const authorise = useCallback(
    (permission: Permission, objectType: string, objectRef: string) => {
      if (permissionMatrix[role].includes(permission)) return true;
      setSeq((s) => s + 1);
      setSessionEvents((prev) => [
        {
          id: `AUD-${seq + 1}`,
          timestamp: now(),
          actor,
          actorType: "System",
          action: `Blocked unauthorised attempt: ${permission}`,
          objectType,
          objectRef,
          beforeAfter: "no change - access denied",
          reason: denialMessage(role, permission, permissionMatrix),
          traceId: "trc-session",
        },
        ...prev,
      ]);
      return false;
    },
    [actor, permissionMatrix, role, seq],
  );

  const pushEvent = useCallback(
    (event: Omit<AuditEventView, "id" | "timestamp">) => {
      setSeq((s) => s + 1);
      setSessionEvents((prev) => [
        { ...event, id: `AUD-${seq + 1}`, timestamp: now() },
        ...prev,
      ]);
    },
    [seq],
  );

  const decideClause = useCallback<DemoState["decideClause"]>(
    (row, decision) => {
      const permission: Permission =
        decision.status === "Approved"
          ? "mapping.approve"
          : decision.status === "Rejected"
            ? "mapping.reject"
            : "mapping.edit";
      if (!authorise(permission, "Mapping row", row.id)) return false;
      setClauseDecisions((prev) => ({
        ...prev,
        [row.id]: { ...decision, reviewer: actor, at: now() },
      }));
      pushEvent({
        actor,
        actorType: "Human",
        action: `${decision.status} mapping for clause ${row.clauseNo}`,
        objectType: "Mapping row",
        objectRef: row.id,
        beforeAfter: `${row.standardId ?? "no mapping"} -> ${decision.standardId ?? "no mapping"}`,
        reason: decision.reason ?? "Reviewer decision recorded in local mock state",
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const completeReview = useCallback<DemoState["completeReview"]>(
    (counts) => {
      if (!authorise("review.complete", "Review item", "REV-0091")) return null;
      const ref = `AUDREF-${Math.floor(Math.random() * 900000 + 100000)}`;
      setAuditReference(ref);
      setReviewStatuses((prev) => ({ ...prev, "REV-0091": "Approved" }));
      pushEvent({
        actor,
        actorType: "Human",
        action: "Completed mapping review",
        objectType: "Review item",
        objectRef: "REV-0091",
        beforeAfter: `Awaiting review -> Approved (${counts["approved"] ?? 0} approved, ${counts["edited"] ?? 0} edited, ${counts["rejected"] ?? 0} rejected)`,
        reason: `Audit reference ${ref} (simulated permanence)`,
        traceId: "trc-session",
      });
      return ref;
    },
    [actor, authorise, pushEvent],
  );

  const setGapRowStatus = useCallback<DemoState["setGapRowStatus"]>(
    (id, status, reason) => {
      const permission: Permission = status === "Approved" ? "gap.approve" : "gap.return";
      if (!authorise(permission, "Gap matrix row", id)) return false;
      setGapRowStatusMap((prev) => ({ ...prev, [id]: status }));
      pushEvent({
        actor,
        actorType: "Human",
        action: `${status === "Approved" ? "Approved" : "Returned"} gap matrix row`,
        objectType: "Gap matrix row",
        objectRef: id,
        beforeAfter: `Not reviewed -> ${status}`,
        reason: reason ?? "Reviewer decision recorded in local mock state",
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const reassign = useCallback<DemoState["reassign"]>(
    (id, reviewer) => {
      if (!authorise("review.reassign", "Review item", id)) return false;
      pushEvent({
        actor,
        actorType: "Human",
        action: "Reassigned review item",
        objectType: "Review item",
        objectRef: id,
        beforeAfter: `reviewer -> ${reviewer}`,
        reason: "Simulated reassignment",
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const saveScenario = useCallback<DemoState["saveScenario"]>(
    (scenario) => {
      if (!authorise("scenario.run", "Gap scenario", scenario.matrixId)) return null;
      const n = scenarioSeq + 1;
      setScenarioSeq(n);
      const saved: GapScenario = {
        ...scenario,
        id: `scn-${n}`,
        runId: `GAP-SIM-${String(1000 + n)}`,
        createdAt: now(),
      };
      setGapScenarios((prev) => [saved, ...prev]);
      pushEvent({
        actor,
        actorType: "Agent",
        action: `Saved gap scenario run "${saved.name}"`,
        objectType: "Gap scenario",
        objectRef: saved.runId,
        beforeAfter: `${saved.matrixName} -> coverage ${saved.coverage}% (${saved.blockers} blockers)`,
        reason: leverSummary(saved.levers),
        traceId: "trc-session",
      });
      return saved;
    },
    [actor, authorise, pushEvent, scenarioSeq],
  );

  const deleteScenario = useCallback((id: string) => {
    setGapScenarios((prev) => prev.filter((s) => s.id !== id));
    setSelectedScenarioId((prev) => (prev === id ? null : prev));
  }, []);

  const selectScenario = useCallback<DemoState["selectScenario"]>(
    (id) => {
      if (!authorise("scenario.select", "Gap scenario", id)) return false;
      setSelectedScenarioId(id);
      setGapScenarios((prev) => {
        const picked = prev.find((s) => s.id === id);
        if (picked) {
          pushEvent({
            actor,
            actorType: "Human",
            action: `Selected preferred gap scenario "${picked.name}"`,
            objectType: "Gap scenario",
            objectRef: picked.runId,
            beforeAfter: `candidate -> preferred version (coverage ${picked.coverage}%)`,
            reason: `${actor} selected the best-performing synthetic scenario`,
            traceId: "trc-session",
          });
        }
        return prev;
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const requestCorrection = useCallback<DemoState["requestCorrection"]>(
    ({ objectRef, objectType, mandateType, proposedChange, reason, traceId }) => {
      if (!authorise("correction.request", "Correction request", objectRef)) return null;
      const n = correctionSeq + 1;
      setCorrectionSeq(n);
      const at = now();
      const rule = ruleFor(signOffRules, mandateType);
      const request: CorrectionRequest = {
        id: `COR-${String(n).padStart(4, "0")}`,
        objectRef,
        objectType,
        mandateType,
        rule: { ...rule, requiredRoles: [...rule.requiredRoles] },
        traceId,
        proposedChange,
        reason,
        status: "Awaiting sign-off",
        requestedBy: actor,
        requestedAt: at,
        signOffs: [],
        history: [
          { stage: "Requested", actor, role: roleName(role), at, note: reason },
        ],
      };
      setCorrectionRequests((prev) => [request, ...prev]);
      pushEvent({
        actor,
        actorType: "Human",
        action: "Raised correction request for sign-off",
        objectType: "Correction request",
        objectRef: `${request.id} (${objectRef})`,
        beforeAfter: `no change yet -> awaiting ${rule.requiredApprovals} sign-off${rule.requiredApprovals === 1 ? "" : "s"}`,
        reason: `${reason} (rule for ${mandateType}: ${ruleSummary(rule)})`,
        traceId,
      });
      return request;
    },
    [actor, authorise, correctionSeq, pushEvent, role, signOffRules],
  );

  /**
   * Rule-driven gate. The mandate's sign-off rule decides which roles may
   * countersign, how many countersignatures are needed and whether the raiser
   * is excluded by segregation of duties.
   */
  const correctionBlocker = useCallback<DemoState["correctionBlocker"]>(
    (request, step) => {
      const rule = request.rule;
      if (step === "signoff") {
        if (request.status !== "Awaiting sign-off")
          return `${request.id} is already ${request.status.toLowerCase()}.`;
        if (rule.segregationOfDuties && request.requestedBy === actor)
          return `Segregation of duties: ${actor} raised ${request.id} and cannot sign it off. Switch to a different reviewer or auditor.`;
        if (rule.requiredRoles.length > 0 && !rule.requiredRoles.includes(role))
          return `The ${request.mandateType} rule allows sign-off only by ${rule.requiredRoles
            .map(roleName)
            .join(" or ")}.`;
        if (request.signOffs.some((s) => s.actor === actor))
          return `${actor} has already countersigned ${request.id}. A different authorised reviewer must give sign-off ${request.signOffs.length + 1} of ${rule.requiredApprovals}.`;
        return null;
      }
      if (request.status === "Awaiting sign-off")
        return `${request.id} has ${request.signOffs.length} of ${rule.requiredApprovals} required sign-offs.`;
      if (request.status !== "Signed off")
        return `${request.id} is already ${request.status.toLowerCase()}.`;
      return null;
    },
    [actor, role],
  );

  const decideCorrection = useCallback(
    (id: string, note: string, approve: boolean) => {
      const request = correctionRequests.find((r) => r.id === id);
      if (!request) return false;
      if (!authorise("correction.signoff", "Correction request", id)) return false;
      if (correctionBlocker(request, "signoff")) return false;
      const at = now();
      const required = request.rule.requiredApprovals;
      const signOffCount = request.signOffs.length + 1;
      const complete = signOffCount >= required;
      setCorrectionRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: approve
                  ? complete
                    ? ("Signed off" as const)
                    : ("Awaiting sign-off" as const)
                  : ("Rejected" as const),
                ...(approve
                  ? {
                      signedOffBy: actor,
                      signOffs: [
                        ...r.signOffs,
                        { actor, role: roleName(role), at, note },
                      ],
                    }
                  : {}),
                history: [
                  ...r.history,
                  {
                    stage: approve ? ("Sign-off" as const) : ("Rejected" as const),
                    actor,
                    role: roleName(role),
                    at,
                    note: approve ? `Sign-off ${signOffCount} of ${required}: ${note}` : note,
                  },
                ],
              }
            : r,
        ),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: approve
          ? `Recorded sign-off ${signOffCount} of ${required} on correction request`
          : "Rejected correction request",
        objectType: "Correction request",
        objectRef: `${request.id} (${request.objectRef})`,
        beforeAfter: `Awaiting sign-off -> ${
          approve ? (complete ? "Signed off" : `awaiting ${required - signOffCount} more`) : "Rejected"
        }`,
        reason: note,
        traceId: request.traceId,
      });
      return true;
    },
    [actor, authorise, correctionBlocker, correctionRequests, pushEvent, role],
  );

  const signOffCorrection = useCallback<DemoState["signOffCorrection"]>(
    (id, note) => decideCorrection(id, note, true),
    [decideCorrection],
  );

  const rejectCorrection = useCallback<DemoState["rejectCorrection"]>(
    (id, note) => decideCorrection(id, note, false),
    [decideCorrection],
  );

  const applyCorrection = useCallback<DemoState["applyCorrection"]>(
    (id) => {
      const request = correctionRequests.find((r) => r.id === id);
      if (!request) return false;
      if (!authorise("audit.correct", "Correction request", id)) return false;
      if (correctionBlocker(request, "apply")) return false;
      const at = now();
      setCorrectionRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "Applied",
                appliedBy: actor,
                history: [
                  ...r.history,
                  {
                    stage: "Applied" as const,
                    actor,
                    role: roleName(role),
                    at,
                    note: `Reversal appended after sign-off by ${r.signedOffBy ?? "reviewer"}.`,
                  },
                ],
              }
            : r,
        ),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: "Applied correction by reversal",
        objectType: "Audit event",
        objectRef: request.objectRef,
        beforeAfter: "original entry retained -> reversing entry appended",
        reason: `${request.reason} (request ${request.id}, signed off by ${request.signedOffBy ?? "reviewer"})`,
        traceId: request.traceId,
      });
      return true;
    },
    [actor, authorise, correctionBlocker, correctionRequests, pushEvent, role],
  );

  const setSignOffRule = useCallback<DemoState["setSignOffRule"]>(
    (mandateType, patch) => {
      if (!authorise("roles.manage", "Sign-off rule", mandateType)) return false;
      const before = ruleSummary(ruleFor(signOffRules, mandateType));
      const next = { ...ruleFor(signOffRules, mandateType), ...patch, mandateType };
      setSignOffRules((prev) => ({ ...prev, [mandateType]: next }));
      pushEvent({
        actor,
        actorType: "Human",
        action: `Updated reviewer sign-off rule for ${mandateType}`,
        objectType: "Sign-off rule",
        objectRef: mandateType,
        beforeAfter: `${before} -> ${ruleSummary(next)}`,
        reason: `${actor} changed the configurable sign-off rule (applies to new requests)`,
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent, signOffRules],
  );

  const resetSignOffRules = useCallback<DemoState["resetSignOffRules"]>(() => {
    if (!authorise("roles.manage", "Sign-off rule", "all")) return false;
    setSignOffRules(baselineSignOffRules());
    pushEvent({
      actor,
      actorType: "Human",
      action: "Reset all reviewer sign-off rules",
      objectType: "Sign-off rule",
      objectRef: "all mandate types",
      beforeAfter: "session changes -> baseline governance rules",
      reason: `${actor} restored the baseline sign-off rules`,
      traceId: "trc-session",
    });
    return true;
  }, [actor, authorise, pushEvent]);

  const setRolePermission = useCallback<DemoState["setRolePermission"]>(
    (targetRole, permission, granted) => {
      if (!authorise("roles.manage", "Role permission", `${targetRole}:${permission}`)) return false;
      setPermissionMatrix((prev) => {
        const current = prev[targetRole];
        const next = granted
          ? current.includes(permission)
            ? current
            : [...current, permission]
          : current.filter((p) => p !== permission);
        return { ...prev, [targetRole]: next };
      });
      pushEvent({
        actor,
        actorType: "Human",
        action: `${granted ? "Granted" : "Revoked"} permission for ${roleName(targetRole)}`,
        objectType: "Role permission",
        objectRef: `${targetRole}:${permission}`,
        beforeAfter: `${granted ? "denied -> granted" : "granted -> denied"}`,
        reason: `${actor} changed the simulated permission matrix`,
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const resetRolePermissions = useCallback<DemoState["resetRolePermissions"]>(
    (targetRole) => {
      if (!authorise("roles.manage", "Role permission", targetRole)) return false;
      setPermissionMatrix((prev) => ({ ...prev, [targetRole]: baselineMatrix()[targetRole] }));
      pushEvent({
        actor,
        actorType: "Human",
        action: `Reset permissions for ${roleName(targetRole)}`,
        objectType: "Role permission",
        objectRef: targetRole,
        beforeAfter: "session changes -> baseline mandate",
        reason: `${actor} restored the baseline permission set`,
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const assignRoleActor = useCallback<DemoState["assignRoleActor"]>(
    (targetRole, personName) => {
      if (!authorise("roles.manage", "Role assignment", targetRole)) return false;
      const before = roleAssignments[targetRole] ?? actorFor(targetRole);
      setRoleAssignments((prev) => ({ ...prev, [targetRole]: personName }));
      pushEvent({
        actor,
        actorType: "Human",
        action: `Assigned ${roleName(targetRole)}`,
        objectType: "Role assignment",
        objectRef: targetRole,
        beforeAfter: `${before} -> ${personName}`,
        reason: `${actor} updated the simulated role holder`,
        traceId: "trc-session",
      });
      return true;
    },
    [actor, authorise, pushEvent, roleAssignments],
  );

  /* --------- Governed data intake: records, ledger, imports, registry -------- */

  const addIntakeRecord = useCallback<DemoState["addIntakeRecord"]>(
    ({ kind, values, asDraft }) => {
      if (!authorise("intake.record.add", recordKindLabels[kind], values["title"] ?? kind))
        return null;
      const n = intakeSeq + 1;
      setIntakeSeq(n);
      const at = now();
      const prefix = kind.slice(0, 3).toUpperCase();
      const id = `${prefix}-${asDraft ? "D" : "A"}-${String(n).padStart(4, "0")}`;
      const def = formFor(kind);
      const fields = Object.fromEntries(
        def.fields
          .filter(
            (f) =>
              !["title", "moduleCode", "owner", "effectiveDate", "source", "reason", "classification"].includes(
                f.key,
              ),
          )
          .map((f) => [f.key, values[f.key] ?? ""] as const),
      );
      if (kind === "risk") {
        const score =
          Number((values["likelihood"] ?? "0").charAt(0)) *
          Number((values["impactRating"] ?? "0").charAt(0));
        fields["riskScore"] = String(score);
      }
      const record: ProgrammeRecordDraft = {
        id,
        kind,
        title: values["title"] ?? values["deliverableId"] ?? values["workPackageId"] ?? recordKindLabels[kind],
        moduleCode: values["moduleCode"] ?? "M03",
        owner: values["owner"] ?? values["consultant"] ?? actor,
        effectiveDate: values["effectiveDate"] ?? "",
        source: values["source"] ?? "",
        reason: values["reason"] ?? "",
        classification: values["classification"] ?? "Internal",
        status: asDraft ? "Draft" : "Accepted",
        fields,
        createdBy: actor,
        createdAt: at,
        history: [
          {
            at,
            actor,
            change: asDraft ? "Draft saved" : "Submitted and accepted after validation",
            reason: values["reason"] ?? "Recorded in local mock state",
          },
        ],
      };
      setIntakeRecords((prev) => [record, ...prev]);
      pushEvent({
        actor,
        actorType: "Human",
        action: `${asDraft ? "Saved draft" : "Accepted"} ${recordKindLabels[kind].toLowerCase()}`,
        objectType: recordKindLabels[kind],
        objectRef: `${record.id} (${record.moduleCode})`,
        beforeAfter: asDraft
          ? `no record -> draft ${record.id}`
          : `no record -> accepted ${record.id}`,
        reason: record.reason || "Governed data intake",
        traceId: "trc-intake",
      });
      return record;
    },
    [actor, authorise, intakeSeq, pushEvent],
  );

  const correctIntakeRecord = useCallback<DemoState["correctIntakeRecord"]>(
    (id, field, value, reason) => {
      const record = intakeRecords.find((r) => r.id === id);
      if (!record) return false;
      if (!authorise("intake.record.add", recordKindLabels[record.kind], id)) return false;
      const before =
        field === "title" ? record.title : field === "owner" ? record.owner : record.fields[field] ?? "";
      const at = now();
      setIntakeRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...(field === "title" ? { title: value } : {}),
                ...(field === "owner" ? { owner: value } : {}),
                fields:
                  field === "title" || field === "owner" ? r.fields : { ...r.fields, [field]: value },
                history: [
                  ...r.history,
                  { at, actor, change: `${field}: "${before}" -> "${value}"`, reason },
                ],
              }
            : r,
        ),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: `Corrected ${recordKindLabels[record.kind].toLowerCase()} field ${field}`,
        objectType: recordKindLabels[record.kind],
        objectRef: id,
        beforeAfter: `${before || "empty"} -> ${value}`,
        reason,
        traceId: "trc-intake",
      });
      return true;
    },
    [actor, authorise, intakeRecords, pushEvent],
  );

  const addLedgerEntry = useCallback<DemoState["addLedgerEntry"]>(
    (values) => {
      if (!authorise("intake.record.add", "Man-day entry", values["workPackage"] ?? "ledger"))
        return null;
      const n = ledgerSeq + 1;
      setLedgerSeq(n);
      const entry: LedgerEntryView = {
        id: `MD-2026-${String(n).padStart(4, "0")}`,
        date: values["effectiveDate"] ?? now(),
        consultant: values["consultant"] ?? actor,
        moduleCode: values["moduleCode"] ?? "M03",
        workPackage: values["workPackage"] ?? "",
        days: Number(values["days"] ?? 0),
        activity: values["title"] ?? "",
        source: values["source"] ?? "",
        kind: "Original",
        recordedBy: actor,
      };
      setLedger((prev) => [entry, ...prev]);
      pushEvent({
        actor,
        actorType: "Human",
        action: "Appended man-day entry",
        objectType: "Man-day entry",
        objectRef: `${entry.id} (${entry.moduleCode} ${entry.workPackage})`,
        beforeAfter: `no entry -> ${entry.days} day(s) appended`,
        reason: values["reason"] ?? "Effort recorded in the append-only ledger",
        traceId: "trc-intake",
      });
      return entry;
    },
    [actor, authorise, ledgerSeq, pushEvent],
  );

  const correctLedgerEntry = useCallback<DemoState["correctLedgerEntry"]>(
    (id, input) => {
      const original = ledger.find((e) => e.id === id && e.kind === "Original");
      if (!original) return false;
      if (!authorise("intake.record.add", "Man-day entry", id)) return false;
      if (ledger.some((e) => e.kind === "Reversal" && e.linkedTo === id)) return false;
      const n = ledgerSeq + 1;
      setLedgerSeq(n + 1);
      const at = now();
      const reversal: LedgerEntryView = {
        ...original,
        id: `${original.id}-R`,
        date: at,
        days: -original.days,
        activity: `Reversal of ${original.id}`,
        kind: "Reversal",
        linkedTo: original.id,
        recordedBy: actor,
        reason: input.reason,
      };
      const replacement: LedgerEntryView = {
        ...original,
        id: `MD-2026-${String(n + 1).padStart(4, "0")}`,
        date: at,
        days: input.days,
        workPackage: input.workPackage,
        activity: input.activity,
        kind: "Replacement",
        linkedTo: original.id,
        recordedBy: actor,
        reason: input.reason,
      };
      setLedger((prev) => [replacement, reversal, ...prev]);
      pushEvent({
        actor,
        actorType: "Human",
        action: "Corrected man-day entry by reversal and replacement",
        objectType: "Man-day entry",
        objectRef: `${original.id} -> ${reversal.id} + ${replacement.id}`,
        beforeAfter: `${original.days} day(s) on ${original.workPackage} retained -> reversal appended, ${input.days} day(s) recorded on ${input.workPackage}`,
        reason: input.reason,
        traceId: "trc-intake",
      });
      return true;
    },
    [actor, authorise, ledger, ledgerSeq, pushEvent],
  );

  /** Append one or more activity items for the intake feed. */
  const pushActivity = useCallback(
    (
      entries: {
        kind: IntakeActivityItem["kind"];
        actor: string;
        proposalId?: string;
        title: string;
        detail: string;
      }[],
    ) => {
      const at = now();
      setActivitySeq((s) => s + entries.length);
      setActivityItems((prev) => {
        const base = activitySeq;
        const items: IntakeActivityItem[] = entries.map((e, i) => ({
          id: `act-s-${String(base + i + 1).padStart(4, "0")}`,
          kind: e.kind,
          at,
          actor: e.actor,
          ...(e.proposalId ? { proposalId: e.proposalId } : {}),
          title: e.title,
          detail: e.detail,
          session: true,
        }));
        return [...items.reverse(), ...prev];
      });
    },
    [activitySeq],
  );

  /** Deliver a notification to each named governance role. */
  const raiseNotifications = useCallback(
    (
      targets: RoleId[],
      input: {
        kind: IntakeNotificationView["kind"];
        proposalId: string;
        title: string;
        body: string;
      },
    ) => {
      if (targets.length === 0) return;
      const at = now();
      setNotifySeq((s) => s + targets.length);
      setNotifications((prev) => {
        const base = notifySeq;
        const items: IntakeNotificationView[] = targets.map((r, i) => ({
          id: `ntf-s-${String(base + i + 1).padStart(4, "0")}`,
          kind: input.kind,
          at,
          recipientRole: r,
          recipient: roleAssignments[r] ?? actorFor(r),
          proposalId: input.proposalId,
          title: input.title,
          body: input.body,
          read: false,
          session: true,
        }));
        return [...items, ...prev];
      });
    },
    [notifySeq, roleAssignments],
  );

  /** Raise a notification for every role holding a permission. */
  const notifyRoles = useCallback(
    (
      permission: Permission,
      input: {
        kind: IntakeNotificationView["kind"];
        proposalId: string;
        title: string;
        body: string;
      },
    ) => {
      const targets = (Object.keys(permissionMatrix) as RoleId[]).filter((r) =>
        permissionMatrix[r].includes(permission),
      );
      raiseNotifications(targets, input);
    },
    [permissionMatrix, raiseNotifications],
  );

  const commitImport = useCallback<DemoState["commitImport"]>(
    ({ importType, sourceName, reason, mapping, rows, acknowledgedWarnings }) => {
      if (!authorise("intake.import", "Import run", importType)) return null;
      const n = receiptSeq + 1;
      setReceiptSeq(n);
      const counts = countOutcomes(rows);
      const dataset = datasetFor(importType);
      const receipt: IntakeReceiptView = {
        id: `IMP-DEMO-${String(n).padStart(4, "0")}`,
        source: sourceName,
        dataType: dataset?.label ?? importType,
        startedBy: actor,
        startedAt: now(),
        accepted: counts.accepted,
        warnings: counts.warnings,
        rejected: counts.rejected,
        noChange: counts.noChange,
        status:
          counts.accepted === 0
            ? "Rejected"
            : counts.warnings > 0
              ? "Completed with warnings"
              : "Completed",
        reason,
        mapping,
        issues: rows.flatMap((r) => (r.issue ? [r.issue] : [])),
        acknowledgedWarnings,
        objectRefs: rows.filter((r) => r.outcome === "Accepted").map((r) => r.reference),
        traceId: `trc-imp-${String(n).padStart(4, "0")}`,
      };
      setReceipts((prev) => [receipt, ...prev]);
      pushEvent({
        actor,
        actorType: "Sync",
        action: `Confirmed guided import of ${receipt.dataType.toLowerCase()}`,
        objectType: "Import receipt",
        objectRef: receipt.id,
        beforeAfter: `${counts.accepted} accepted, ${counts.warnings} warnings, ${counts.rejected} rejected (not applied), ${counts.noChange} unchanged`,
        reason,
        traceId: receipt.traceId,
      });
      return receipt;
    },
    [actor, authorise, pushEvent, receiptSeq],
  );

  const submitProposal = useCallback<DemoState["submitProposal"]>(
    (input) => {
      if (!authorise("registry.propose", "Registry change proposal", input.moduleCode)) return null;
      const n = proposalSeq + 1;
      setProposalSeq(n);
      const proposal: RegistryChangeProposalView = {
        ...input,
        id: `PRP-${String(n).padStart(4, "0")}`,
        requestedBy: actor,
        requestedAt: now(),
        status: "Pending owner approval",
      };
      setProposals((prev) => [proposal, ...prev]);
      const warnings = proposal.validation.filter((v) => v.result !== "pass").length;
      pushActivity([
        {
          kind: "proposal.submitted",
          actor,
          proposalId: proposal.id,
          title: `${proposal.changeType} proposal raised`,
          detail: `${proposal.moduleCode} ${proposal.moduleName} sent for owner approval. Source ${proposal.sourceRef}.`,
        },
        {
          kind: "proposal.validation",
          actor: "Registry validation agent",
          proposalId: proposal.id,
          title: "Validation checks completed",
          detail: `${proposal.validation.length - warnings} passed, ${warnings} needing attention. No registry change applied yet.`,
        },
      ]);
      notifyRoles("registry.approve", {
        kind: "review.requested",
        proposalId: proposal.id,
        title: `${proposal.id} awaiting your approval`,
        body: `${actor} proposed ${proposal.changeType.toLowerCase()} for ${proposal.moduleCode} ${proposal.moduleName}.${
          warnings > 0 ? ` ${warnings} validation item(s) need attention.` : ""
        }`,
      });
      pushEvent({
        actor,
        actorType: "Human",
        action: `Submitted registry change proposal (${proposal.changeType})`,
        objectType: "Registry change proposal",
        objectRef: `${proposal.id} (${proposal.moduleCode})`,
        beforeAfter: "governed registry unchanged -> pending owner approval",
        reason: proposal.rationale,
        traceId: "trc-registry",
      });
      return proposal;
    },
    [actor, authorise, notifyRoles, proposalSeq, pushActivity, pushEvent],
  );

  const decideProposal = useCallback<DemoState["decideProposal"]>(
    (id, approve, reason) => {
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal) return false;
      if (!authorise("registry.approve", "Registry change proposal", id)) return false;
      if (proposal.status !== "Pending owner approval") return false;
      const at = now();
      setProposals((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: approve ? "Approved" : "Rejected",
                decidedBy: actor,
                decidedAt: at,
                decisionReason: reason,
              }
            : p,
        ),
      );
      if (approve) {
        setActiveModules((prev) => {
          if (proposal.changeType === "Retire module")
            return prev.filter((m) => m.code !== proposal.moduleCode);
          if (proposal.changeType === "Amend module")
            return prev.map((m) =>
              m.code === proposal.moduleCode
                ? { ...m, label: proposal.moduleName, estate: proposal.estate }
                : m,
            );
          if (prev.some((m) => m.code === proposal.moduleCode)) return prev;
          const added: ModuleSummary = {
            id: proposal.moduleCode,
            code: proposal.moduleCode,
            label: proposal.moduleName,
            estate: proposal.estate,
            rag: "amber",
            progress: 0,
            stage: STAGES[0]!,
            nextGate: "PG1 - 26 Aug 2026",
            baselineVarianceDays: 0,
            openRisks: 0,
            criticalIssues: 0,
            evidenceGaps: 0,
            ownerId: "p-nabila",
            overduePackages: 0,
            causes: ["evidence-incomplete"],
          };
          return [...prev, added];
        });
      }
      pushEvent({
        actor,
        actorType: "Human",
        action: `${approve ? "Approved" : "Rejected"} registry change proposal`,
        objectType: "Registry change proposal",
        objectRef: `${proposal.id} (${proposal.moduleCode})`,
        beforeAfter: approve
          ? `pending -> approved, synthetic registry change applied (${proposal.changeType.toLowerCase()})`
          : "pending -> rejected, governed registry unchanged",
        reason: `${reason} (requested by ${proposal.requestedBy}, decided by ${actor} at ${at})`,
        traceId: "trc-registry",
      });
      pushActivity([
        {
          kind: approve ? "proposal.approved" : "proposal.rejected",
          actor,
          proposalId: proposal.id,
          title: `${proposal.changeType} proposal ${approve ? "approved" : "rejected"}`,
          detail: approve
            ? `${proposal.moduleCode} ${proposal.moduleName} applied to the session registry. Reason: ${reason}`
            : `${proposal.moduleCode} returned to ${proposal.requestedBy}. Reason: ${reason}`,
        },
      ]);
      const requesterRole = (Object.keys(roleAssignments) as RoleId[]).find(
        (r) => roleAssignments[r] === proposal.requestedBy,
      );
      raiseNotifications(requesterRole ? [requesterRole] : ["lead"], {
        kind: "decision.recorded",
        proposalId: proposal.id,
        title: `${proposal.id} ${approve ? "approved" : "rejected"}`,
        body: `${actor} ${approve ? "approved" : "rejected"} your ${proposal.changeType.toLowerCase()} request for ${proposal.moduleCode}. Reason: ${reason}`,
      });
      return true;
    },
    [actor, authorise, proposals, pushActivity, pushEvent, raiseNotifications, roleAssignments],
  );

  const remindProposalOwner = useCallback<DemoState["remindProposalOwner"]>(
    (id) => {
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal || proposal.status !== "Pending owner approval") return false;
      notifyRoles("registry.approve", {
        kind: "review.reminder",
        proposalId: proposal.id,
        title: `Reminder: ${proposal.id} still awaiting approval`,
        body: `${actor} nudged the owner queue for ${proposal.changeType.toLowerCase()} of ${proposal.moduleCode} ${proposal.moduleName}.`,
      });
      pushActivity([
        {
          kind: "notification.sent",
          actor,
          proposalId: proposal.id,
          title: "Owner reminded",
          detail: "A reminder notification was delivered to every role that can approve registry changes.",
        },
      ]);
      pushEvent({
        actor,
        actorType: "Human",
        action: "Sent owner reminder for registry change proposal",
        objectType: "Registry change proposal",
        objectRef: `${proposal.id} (${proposal.moduleCode})`,
        beforeAfter: "pending owner approval -> pending, reminder notification appended",
        reason: "Owner decision outstanding",
        traceId: "trc-registry",
      });
      return true;
    },
    [actor, notifyRoles, proposals, pushActivity, pushEvent],
  );

  const markNotificationRead = useCallback<DemoState["markNotificationRead"]>((id, read = true) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.recipientRole === role ? { ...n, read: true } : n)));
  }, [role]);

  /* ---- Production readiness centre: evidence, attestation and acceptance ---- */

  const updateEvidenceState = useCallback<DemoState["updateEvidenceState"]>(
    (id, state, note, reference) => {
      const artifact = evidenceRegister.find((a) => a.id === id);
      if (!artifact) return false;
      if (!authorise("readiness.update", "Evidence artifact", id)) return false;
      const at = now();
      setEvidenceRegister((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                state,
                note,
                ...(reference ? { reference } : {}),
                ...(isGateReady(state)
                  ? { attestedBy: actor, attestedAt: at }
                  : { attestedBy: "Not recorded", attestedAt: "Not recorded" }),
              }
            : a,
        ),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: `Recorded input readiness: ${state}`,
        objectType: "Evidence artifact",
        objectRef: `${artifact.id} (${artifact.title})`,
        beforeAfter: `${artifact.state} -> ${state}`,
        reason: note || "No reason supplied",
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, evidenceRegister, pushEvent],
  );

  const attachmentsFor = useCallback(
    (artifactId: string) => evidenceAttachments.filter((a) => a.artifactId === artifactId),
    [evidenceAttachments],
  );

  const attachEvidenceFile = useCallback<DemoState["attachEvidenceFile"]>(
    ({ artifactId, file, kind, linkedState, reference, note }) => {
      const artifact = evidenceRegister.find((a) => a.id === artifactId);
      if (!artifact) return null;
      if (!authorise("readiness.update", "Evidence artifact", artifactId)) return null;
      const rejection = validateEvidenceFile(file);
      if (rejection) return null;
      const seqNo = attachmentSeq;
      setAttachmentSeq((n) => n + 1);
      const lineageId = lineageKey({ artifactId, linkedState, reference: reference || "Not recorded" });
      const priorRevisions = evidenceAttachments.filter((a) => a.lineageId === lineageId);
      const previous = priorRevisions.reduce<EvidenceAttachment | null>(
        (best, a) => (!best || a.revision > best.revision ? a : best),
        null,
      );
      const revision = (previous?.revision ?? 0) + 1;
      const attachment: EvidenceAttachment = {
        id: `ATT-${String(seqNo).padStart(3, "0")}`,
        artifactId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        kind,
        linkedState,
        linkedLevel: artifact.level,
        reference: reference || "Not recorded",
        note,
        uploadedBy: actor,
        uploadedAt: now(),
        checksum: placeholderChecksum(file.name, file.size, seqNo),
        lineageId,
        revision,
        status: "Current",
        ...(previous ? { supersedesId: previous.id } : {}),
        ...(typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? { previewUrl: URL.createObjectURL(file) }
          : {}),
      };
      setEvidenceAttachments((prev) => [
        attachment,
        ...prev.map((a) =>
          a.lineageId === lineageId && a.status === "Current"
            ? {
                ...a,
                status: "Superseded" as const,
                supersededById: attachment.id,
              }
            : a,
        ),
      ]);
      pushEvent({
        actor,
        actorType: "Human",
        action:
          revision === 1
            ? `Attached evidence file (${kind})`
            : `Uploaded evidence revision r${revision} (${kind})`,
        objectType: "Evidence artifact",
        objectRef: `${artifact.id} (${artifact.title})`,
        beforeAfter: previous
          ? `${previous.id} r${previous.revision} (${previous.fileName}) -> ${attachment.id} r${revision} (${file.name} · ${formatBytes(file.size)}) · lineage ${lineageId}`
          : `${attachment.id} r1 · ${file.name} · ${formatBytes(file.size)} · linked state ${linkedState} · reference ${attachment.reference}`,
        reason: note || "No reason supplied",
        traceId: "trc-readiness",
      });
      return attachment;
    },
    [actor, attachmentSeq, authorise, evidenceAttachments, evidenceRegister, pushEvent],
  );

  const removeEvidenceAttachment = useCallback<DemoState["removeEvidenceAttachment"]>(
    (attachmentId, reason) => {
      const attachment = evidenceAttachments.find((a) => a.id === attachmentId);
      if (!attachment) return false;
      if (!authorise("readiness.update", "Evidence artifact", attachment.artifactId)) return false;
      const restored =
        attachment.status === "Current"
          ? evidenceAttachments
              .filter((a) => a.lineageId === attachment.lineageId && a.id !== attachmentId)
              .reduce<EvidenceAttachment | null>(
                (best, a) => (!best || a.revision > best.revision ? a : best),
                null,
              )
          : null;
      setEvidenceAttachments((prev) =>
        prev
          .filter((a) => a.id !== attachmentId)
          .map((a) => {
            if (restored && a.id === restored.id) {
              const { supersededById: _dropped, ...rest } = a;
              return { ...rest, status: "Current" as const };
            }
            return a;
          }),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: `Detached evidence revision r${attachment.revision}`,
        objectType: "Evidence artifact",
        objectRef: `${attachment.artifactId} · ${attachment.id}`,
        beforeAfter: restored
          ? `${attachment.fileName} (r${attachment.revision}) removed -> ${restored.id} r${restored.revision} reinstated as current`
          : `${attachment.fileName} (r${attachment.revision}) -> removed from register`,
        reason: reason || "No reason supplied",
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, evidenceAttachments, pushEvent],
  );

  const rollbackEvidenceRevision = useCallback<DemoState["rollbackEvidenceRevision"]>(
    (attachmentId, reason) => {
      const target = evidenceAttachments.find((a) => a.id === attachmentId);
      if (!target) return false;
      if (target.status === "Current") return false;
      if (!authorise("evidence.rollback", "Evidence artifact", target.artifactId)) return false;
      const supersededCurrent = evidenceAttachments.find(
        (a) => a.lineageId === target.lineageId && a.status === "Current",
      );
      const stamp = now();
      setEvidenceAttachments((prev) =>
        prev.map((a) => {
          if (a.id === target.id) {
            const { supersededById: _cleared, ...rest } = a;
            return {
              ...rest,
              status: "Current" as const,
              ...(supersededCurrent ? { reinstatedFromId: supersededCurrent.id } : {}),
              reinstatedBy: actor,
              reinstatedAt: stamp,
              reinstatementReason: reason || "No reason supplied",
            };
          }
          if (a.lineageId === target.lineageId && a.status === "Current") {
            return { ...a, status: "Superseded" as const, supersededById: target.id };
          }
          return a;
        }),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: `Rolled evidence lineage back to revision r${target.revision}`,
        objectType: "Evidence artifact",
        objectRef: `${target.artifactId} · ${target.id}`,
        beforeAfter: supersededCurrent
          ? `${supersededCurrent.id} r${supersededCurrent.revision} (${supersededCurrent.fileName}) current -> ${target.id} r${target.revision} (${target.fileName}) current · lineage ${target.lineageId}`
          : `${target.id} r${target.revision} (${target.fileName}) marked current · lineage ${target.lineageId}`,
        reason: reason || "No reason supplied",
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, evidenceAttachments, pushEvent],
  );

  const requestPacketAttestation = useCallback<DemoState["requestPacketAttestation"]>(
    (packetId) => {
      const packet = packetById(packetId);
      if (!packet) return false;
      if (!authorise("readiness.update", "Delivery packet", packet.code)) return false;
      pushEvent({
        actor,
        actorType: "Human",
        action: "Requested owner attestation for delivery packet",
        objectType: "Delivery packet",
        objectRef: `${packet.code} - ${packet.name}`,
        beforeAfter: "no change - attestation requested",
        reason: `Attestation requested from ${packet.owner} (${packet.ownerRole}). Simulated request only.`,
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const attestPacket = useCallback<DemoState["attestPacket"]>(
    (packetId, reason) => {
      const packet = packetById(packetId);
      if (!packet) return false;
      if (!authorise("readiness.update", "Delivery packet", packet.code)) return false;
      setPacketAttestations((prev) => ({
        ...prev,
        [packetId]: { actor, at: now(), reason },
      }));
      pushEvent({
        actor,
        actorType: "Human",
        action: "Recorded readiness attestation for delivery packet",
        objectType: "Delivery packet",
        objectRef: `${packet.code} - ${packet.name}`,
        beforeAfter: "not attested -> attested (simulated)",
        reason,
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, pushEvent],
  );

  const acceptanceBlockers = useCallback<DemoState["acceptanceBlockers"]>(
    (packetId) => {
      const packet = packetById(packetId);
      if (!packet) return ["Unknown delivery packet"];
      const blockers: string[] = [];
      if (acceptedPackets.includes(packetId)) return ["This packet is already accepted."];
      if (activePacket(acceptedPackets) !== packetId) {
        blockers.push(
          "A prior packet is not accepted yet. Work-in-progress is limited to one active packet.",
        );
      }
      const outstanding = packet.requiredEvidence.filter((id) => {
        const artifact = evidenceRegister.find((a) => a.id === id);
        return !artifact || !isGateReady(artifact.state);
      });
      if (outstanding.length > 0) {
        blockers.push(
          `${outstanding.length} mandatory evidence item(s) are not Ready for review: ${outstanding.join(", ")}.`,
        );
      }
      const attestation = packetAttestations[packetId];
      if (!attestation) {
        blockers.push(`${packet.owner} (${packet.ownerRole}) has not attested readiness.`);
      } else if (attestation.actor === actor) {
        blockers.push(
          "Dual control: the actor who attested readiness cannot also record independent acceptance.",
        );
      }
      return blockers;
    },
    [acceptedPackets, actor, evidenceRegister, packetAttestations],
  );

  const acceptPacket = useCallback<DemoState["acceptPacket"]>(
    (packetId, reason) => {
      const packet = packetById(packetId);
      if (!packet) return false;
      if (!authorise("readiness.accept", "Delivery packet", packet.code)) return false;
      if (acceptanceBlockers(packetId).length > 0) return false;
      const at = now();
      setAcceptedPackets((prev) => (prev.includes(packetId) ? prev : [...prev, packetId]));
      setAcceptanceHistory((prev) => [
        {
          id: `ACC-${prev.length + 1}`,
          packetId,
          packetVersion: `${packet.code} v1 (synthetic)`,
          actor,
          at,
          reason,
          evidence: packet.requiredEvidence,
        },
        ...prev,
      ]);
      pushEvent({
        actor,
        actorType: "Human",
        action: "Accepted delivery packet against its acceptance gate",
        objectType: "Delivery packet",
        objectRef: `${packet.code} - ${packet.name}`,
        beforeAfter: "active -> accepted (append-only; corrections use reversal)",
        reason: `${reason} | Evidence pack: ${packet.requiredEvidence.join(", ")}`,
        traceId: "trc-readiness",
      });
      return true;
    },
    [acceptanceBlockers, actor, authorise, pushEvent],
  );

  const approveReviewPackage = useCallback<DemoState["approveReviewPackage"]>(
    (id, note) => {
      const pack = reviewPackages.find((p) => p.id === id);
      if (!pack) return false;
      if (!authorise("review.package", "Review package", id)) return false;
      if (pack.state !== "Validated - awaiting reviewer approval") return false;
      if (pack.validation.some((row) => row.blocked)) return false;
      setReviewPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, state: "Approved" } : p)),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: "Approved governed review package",
        objectType: "Review package",
        objectRef: `${pack.id} ${pack.version} (${pack.sopRef})`,
        beforeAfter: "validated -> approved mapping (simulated)",
        reason: note || "Reviewer approval recorded in local mock state",
        traceId: "trc-readiness",
      });
      return true;
    },
    [actor, authorise, pushEvent, reviewPackages],
  );

  const resetDemo = useCallback(() => {
    setEvidenceRegister(seedEvidenceRegister);
    setEvidenceAttachments([]);
    setAttachmentSeq(1);
    setPacketAttestations({});
    setAcceptedPackets([]);
    setAcceptanceHistory([]);
    setReviewPackages(seedReviewPackages);
    setPermissionMatrix(baselineMatrix());
    setSignOffRules(baselineSignOffRules());
    setRoleAssignments(
      Object.fromEntries(
        (Object.keys(baselineMatrix()) as RoleId[]).map((r) => [r, actorFor(r)] as const),
      ) as Record<RoleId, string>,
    );
    setClauseDecisions({});
    setSessionEvents([]);
    setAuditReference(null);
    setGapScenarios([]);
    setSelectedScenarioId(null);
    setScenarioSeq(0);
    setCorrectionRequests(seedCorrectionRequests);
    setCorrectionSeq(41);
    setGapRowStatusMap(
      Object.fromEntries(gapAnalyses.flatMap((g) => g.rows.map((r) => [r.id, r.reviewStatus] as const))),
    );
    setReviewStatuses(Object.fromEntries(reviewQueue.map((r) => [r.id, r.status] as const)));
    setActiveModules(modules);
    setIntakeRecords(seedIntakeRecords);
    setIntakeSeq(3);
    setLedger(seedLedger);
    setLedgerSeq(91);
    setReceipts(seedReceipts);
    setReceiptSeq(42);
    setProposals(seedProposals);
    setProposalSeq(7);
    setActivityItems([]);
    setNotifications(seedIntakeNotifications);
    setNotifySeq(3);
    setActivitySeq(7);
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      role,
      setRole,
      signedIn,
      signIn: (next: RoleId) => {
        setRole(next);
        setSignedIn(true);
      },
      signOut: () => setSignedIn(false),
      can: allows,
      denialReason,
      actor,
      clauseDecisions,
      decideClause,
      reviewCompleted: Object.keys(clauseDecisions).length >= mappingRows.length,
      completeReview,
      auditReference,
      gapRowStatus,
      setGapRowStatus,
      gapScenarios,
      saveScenario,
      deleteScenario,
      selectedScenarioId,
      selectScenario,
      reviewStatuses,
      reassign,
      correctionRequests,
      requestCorrection,
      signOffCorrection,
      rejectCorrection,
      applyCorrection,
      correctionBlocker,
      signOffRules,
      setSignOffRule,
      resetSignOffRules,
      permissionMatrix,
      setRolePermission,
      resetRolePermissions,
      roleAssignments,
      assignRoleActor,
      activeModules,
      moduleByCode: (code: string) => activeModules.find((m) => m.code === code),
      intakeRecords,
      addIntakeRecord,
      correctIntakeRecord,
      ledger,
      addLedgerEntry,
      correctLedgerEntry,
      receipts,
      commitImport,
      proposals,
      submitProposal,
      decideProposal,
      intakeActivity: [...activityItems, ...seedIntakeActivity],
      intakeNotifications: notifications,
      unreadNotifications: notifications.filter((n) => n.recipientRole === role && !n.read).length,
      markNotificationRead,
      markAllNotificationsRead,
      remindProposalOwner,
      auditEvents: [...sessionEvents, ...seedAuditEvents],
      evidenceRegister,
      updateEvidenceState,
      evidenceAttachments,
      attachmentsFor,
      attachEvidenceFile,
      removeEvidenceAttachment,
      rollbackEvidenceRevision,
      requestPacketAttestation,
      packetAttestations,
      attestPacket,
      acceptedPackets,
      acceptanceHistory,
      acceptPacket,
      acceptanceBlockers,
      reviewPackages,
      approveReviewPackage,
      resetDemo,
    }),
    [
      role,
      signedIn,
      allows,
      denialReason,
      evidenceRegister,
      updateEvidenceState,
      evidenceAttachments,
      attachmentsFor,
      attachEvidenceFile,
      removeEvidenceAttachment,
      rollbackEvidenceRevision,
      requestPacketAttestation,
      packetAttestations,
      attestPacket,
      acceptedPackets,
      acceptanceHistory,
      acceptPacket,
      acceptanceBlockers,
      reviewPackages,
      approveReviewPackage,
      actor,
      clauseDecisions,
      decideClause,
      completeReview,
      auditReference,
      gapRowStatus,
      setGapRowStatus,
      gapScenarios,
      saveScenario,
      deleteScenario,
      selectedScenarioId,
      selectScenario,
      reviewStatuses,
      reassign,
      correctionRequests,
      requestCorrection,
      signOffCorrection,
      rejectCorrection,
      applyCorrection,
      correctionBlocker,
      signOffRules,
      setSignOffRule,
      resetSignOffRules,
      permissionMatrix,
      setRolePermission,
      resetRolePermissions,
      roleAssignments,
      assignRoleActor,
      activeModules,
      intakeRecords,
      addIntakeRecord,
      correctIntakeRecord,
      ledger,
      addLedgerEntry,
      correctLedgerEntry,
      receipts,
      commitImport,
      proposals,
      submitProposal,
      decideProposal,
      activityItems,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      remindProposalOwner,
      sessionEvents,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoState() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoState must be used inside DemoStateProvider");
  return ctx;
}