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
import { mappingRows } from "./mapping";
import { gapAnalyses } from "./gaps";
import { reviewQueue } from "./reviews";
import { leverSummary, type GapScenario } from "./scenarios";
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
  clauseDecisions: Record<string, ClauseDecision>;
  decideClause: (row: MappingRowView, decision: Omit<ClauseDecision, "reviewer" | "at">) => void;
  reviewCompleted: boolean;
  completeReview: (counts: Record<string, number>) => string;
  auditReference: string | null;
  gapRowStatus: Record<string, "Not reviewed" | "Approved" | "Returned">;
  setGapRowStatus: (id: string, status: "Approved" | "Returned", reason?: string) => void;
  gapScenarios: GapScenario[];
  saveScenario: (scenario: Omit<GapScenario, "id" | "createdAt" | "runId">) => GapScenario;
  deleteScenario: (id: string) => void;
  selectedScenarioId: string | null;
  selectScenario: (id: string) => void;
  reviewStatuses: Record<string, ReviewQueueItem["status"]>;
  reassign: (id: string, reviewer: string) => void;
  auditEvents: AuditEventView[];
  resetDemo: () => void;
}

const REVIEWER = "Dr. Maya Rahman";

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
      setClauseDecisions((prev) => ({
        ...prev,
        [row.id]: { ...decision, reviewer: REVIEWER, at: now() },
      }));
      pushEvent({
        actor: REVIEWER,
        actorType: "Human",
        action: `${decision.status} mapping for clause ${row.clauseNo}`,
        objectType: "Mapping row",
        objectRef: row.id,
        beforeAfter: `${row.standardId ?? "no mapping"} -> ${decision.standardId ?? "no mapping"}`,
        reason: decision.reason ?? "Reviewer decision recorded in local mock state",
        traceId: "trc-session",
      });
    },
    [pushEvent],
  );

  const completeReview = useCallback(
    (counts: Record<string, number>) => {
      const ref = `AUDREF-${Math.floor(Math.random() * 900000 + 100000)}`;
      setAuditReference(ref);
      setReviewStatuses((prev) => ({ ...prev, "REV-0091": "Approved" }));
      pushEvent({
        actor: REVIEWER,
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
    [pushEvent],
  );

  const setGapRowStatus = useCallback<DemoState["setGapRowStatus"]>(
    (id, status, reason) => {
      setGapRowStatusMap((prev) => ({ ...prev, [id]: status }));
      pushEvent({
        actor: REVIEWER,
        actorType: "Human",
        action: `${status === "Approved" ? "Approved" : "Returned"} gap matrix row`,
        objectType: "Gap matrix row",
        objectRef: id,
        beforeAfter: `Not reviewed -> ${status}`,
        reason: reason ?? "Reviewer decision recorded in local mock state",
        traceId: "trc-session",
      });
    },
    [pushEvent],
  );

  const reassign = useCallback<DemoState["reassign"]>(
    (id, reviewer) => {
      pushEvent({
        actor: REVIEWER,
        actorType: "Human",
        action: "Reassigned review item",
        objectType: "Review item",
        objectRef: id,
        beforeAfter: `reviewer -> ${reviewer}`,
        reason: "Simulated reassignment",
        traceId: "trc-session",
      });
    },
    [pushEvent],
  );

  const saveScenario = useCallback<DemoState["saveScenario"]>(
    (scenario) => {
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
        actor: REVIEWER,
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
    [pushEvent, scenarioSeq],
  );

  const deleteScenario = useCallback((id: string) => {
    setGapScenarios((prev) => prev.filter((s) => s.id !== id));
    setSelectedScenarioId((prev) => (prev === id ? null : prev));
  }, []);

  const selectScenario = useCallback<DemoState["selectScenario"]>(
    (id) => {
      setSelectedScenarioId(id);
      setGapScenarios((prev) => {
        const picked = prev.find((s) => s.id === id);
        if (picked) {
          pushEvent({
            actor: REVIEWER,
            actorType: "Human",
            action: `Selected preferred gap scenario "${picked.name}"`,
            objectType: "Gap scenario",
            objectRef: picked.runId,
            beforeAfter: `candidate -> preferred version (coverage ${picked.coverage}%)`,
            reason: "Reviewer selected the best-performing synthetic scenario",
            traceId: "trc-session",
          });
        }
        return prev;
      });
    },
    [pushEvent],
  );

  const resetDemo = useCallback(() => {
    setClauseDecisions({});
    setSessionEvents([]);
    setAuditReference(null);
    setGapScenarios([]);
    setSelectedScenarioId(null);
    setScenarioSeq(0);
    setGapRowStatusMap(
      Object.fromEntries(gapAnalyses.flatMap((g) => g.rows.map((r) => [r.id, r.reviewStatus] as const))),
    );
    setReviewStatuses(Object.fromEntries(reviewQueue.map((r) => [r.id, r.status] as const)));
  }, []);

  const value = useMemo<DemoState>(
    () => ({
      role,
      setRole,
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
      auditEvents: [...sessionEvents, ...seedAuditEvents],
      resetDemo,
    }),
    [
      role,
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