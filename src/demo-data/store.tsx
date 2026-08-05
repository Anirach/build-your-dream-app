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
  seedCorrectionRequests,
  type CorrectionRequest,
} from "./corrections";
import { mappingRows } from "./mapping";
import { gapAnalyses } from "./gaps";
import { reviewQueue } from "./reviews";
import { leverSummary, type GapScenario } from "./scenarios";
import {
  actorFor,
  baselineMatrix,
  denialMessage,
  roleName,
  type Permission,
  type PermissionMatrix,
} from "./permissions";
import type { AuditEventView, MappingRowView, ReviewQueueItem, RoleId } from "./types";

export interface ClauseDecision {
  status: MappingRowView["reviewStatus"];
  standardId: string | null;
  reason?: string;
  reviewer: string;
  at: string;
}

interface DemoState {
  role: RoleId;
  setRole: (role: RoleId) => void;
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
    proposedChange: string;
    reason: string;
    traceId: string;
  }) => CorrectionRequest | null;
  signOffCorrection: (id: string, note: string) => boolean;
  rejectCorrection: (id: string, note: string) => boolean;
  applyCorrection: (id: string) => boolean;
  /** Why the active actor cannot act on this request, beyond permissions. */
  correctionBlocker: (request: CorrectionRequest, step: "signoff" | "apply") => string | null;
  /** Session-editable permission matrix and actor assignments. */
  permissionMatrix: PermissionMatrix;
  setRolePermission: (role: RoleId, permission: Permission, granted: boolean) => boolean;
  resetRolePermissions: (role: RoleId) => boolean;
  roleAssignments: Record<RoleId, string>;
  assignRoleActor: (role: RoleId, personName: string) => boolean;
  auditEvents: AuditEventView[];
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
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(baselineMatrix);
  const [roleAssignments, setRoleAssignments] = useState<Record<RoleId, string>>(() =>
    Object.fromEntries(
      (Object.keys(baselineMatrix()) as RoleId[]).map((r) => [r, actorFor(r)] as const),
    ) as Record<RoleId, string>,
  );

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
    ({ objectRef, objectType, proposedChange, reason, traceId }) => {
      if (!authorise("correction.request", "Correction request", objectRef)) return null;
      const n = correctionSeq + 1;
      setCorrectionSeq(n);
      const at = now();
      const request: CorrectionRequest = {
        id: `COR-${String(n).padStart(4, "0")}`,
        objectRef,
        objectType,
        traceId,
        proposedChange,
        reason,
        status: "Awaiting sign-off",
        requestedBy: actor,
        requestedAt: at,
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
        beforeAfter: "no change yet -> awaiting reviewer sign-off",
        reason,
        traceId,
      });
      return request;
    },
    [actor, authorise, correctionSeq, pushEvent, role],
  );

  /**
   * Segregation of duties: the actor who raised a request may not countersign
   * it, and a request may only be applied once it has been signed off.
   */
  const correctionBlocker = useCallback<DemoState["correctionBlocker"]>(
    (request, step) => {
      if (step === "signoff") {
        if (request.status !== "Awaiting sign-off")
          return `${request.id} is already ${request.status.toLowerCase()}.`;
        if (request.requestedBy === actor)
          return `Segregation of duties: ${actor} raised ${request.id} and cannot sign it off. Switch role to a different reviewer or auditor.`;
        return null;
      }
      if (request.status === "Awaiting sign-off")
        return `${request.id} needs reviewer sign-off before it can be applied.`;
      if (request.status !== "Signed off")
        return `${request.id} is already ${request.status.toLowerCase()}.`;
      return null;
    },
    [actor],
  );

  const decideCorrection = useCallback(
    (id: string, note: string, approve: boolean) => {
      const request = correctionRequests.find((r) => r.id === id);
      if (!request) return false;
      if (!authorise("correction.signoff", "Correction request", id)) return false;
      if (correctionBlocker(request, "signoff")) return false;
      const at = now();
      setCorrectionRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: approve ? "Signed off" : "Rejected",
                ...(approve ? { signedOffBy: actor } : {}),
                history: [
                  ...r.history,
                  {
                    stage: approve ? ("Sign-off" as const) : ("Rejected" as const),
                    actor,
                    role: roleName(role),
                    at,
                    note,
                  },
                ],
              }
            : r,
        ),
      );
      pushEvent({
        actor,
        actorType: "Human",
        action: approve ? "Signed off correction request" : "Rejected correction request",
        objectType: "Correction request",
        objectRef: `${request.id} (${request.objectRef})`,
        beforeAfter: `Awaiting sign-off -> ${approve ? "Signed off" : "Rejected"}`,
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

  const resetDemo = useCallback(() => {
    setPermissionMatrix(baselineMatrix());
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
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      role,
      setRole,
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
      permissionMatrix,
      setRolePermission,
      resetRolePermissions,
      roleAssignments,
      assignRoleActor,
      auditEvents: [...sessionEvents, ...seedAuditEvents],
      resetDemo,
    }),
    [
      role,
      allows,
      denialReason,
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
      permissionMatrix,
      setRolePermission,
      resetRolePermissions,
      roleAssignments,
      assignRoleActor,
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