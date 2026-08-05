// Concept-only presentation model. SLA analytics over correction hand-offs:
// breach rates, average turnaround and weekly trends by mandate type and by the
// reviewer role that handled the stage. History below is synthetic so the
// analytics view is never empty; live session requests are folded in on top.
import { parseStamp, slaTargetHours } from "./correction-timeline";
import type { CorrectionRequest } from "./corrections";
import { roleName } from "./permissions";
import { mandateTypes, type MandateType } from "./signoff-rules";
import type { RoleId } from "./types";

export type SlaStage = "Sign-off" | "Applied";

export interface SlaRecord {
  id: string;
  requestId: string;
  mandateType: MandateType;
  /** Role that completed the hand-off. */
  role: RoleId;
  stage: SlaStage;
  /** Hours the hand-off took. */
  hours: number;
  targetHours: number;
  /** ISO-ish week label used for the trend axis. */
  week: string;
  live: boolean;
}

export const trendWeeks = ["W27", "W28", "W29", "W30", "W31", "W32"] as const;

function rec(
  i: number,
  mandateType: MandateType,
  role: RoleId,
  stage: SlaStage,
  hours: number,
  week: string,
): SlaRecord {
  return {
    id: `SLA-${String(i).padStart(4, "0")}`,
    requestId: `COR-${String(9000 + i).slice(1)}`,
    mandateType,
    role,
    stage,
    hours,
    targetHours: slaTargetHours[stage],
    week,
    live: false,
  };
}

/** Deterministic synthetic hand-off history across six programme weeks. */
export const slaHistory: SlaRecord[] = [
  rec(1, "Effort entry", "reviewer", "Sign-off", 31, "W27"),
  rec(2, "Effort entry", "auditor", "Sign-off", 26, "W27"),
  rec(3, "Effort entry", "pmo", "Applied", 5, "W27"),
  rec(4, "Mapping row", "reviewer", "Sign-off", 12, "W27"),
  rec(5, "Audit event", "auditor", "Sign-off", 40, "W27"),
  rec(6, "Audit event", "pmo", "Applied", 11, "W27"),

  rec(7, "Effort entry", "reviewer", "Sign-off", 22, "W28"),
  rec(8, "Mapping row", "reviewer", "Sign-off", 9, "W28"),
  rec(9, "Mapping row", "pmo", "Applied", 4, "W28"),
  rec(10, "Gap matrix row", "lead", "Sign-off", 27, "W28"),
  rec(11, "Standard crosswalk", "auditor", "Sign-off", 14, "W28"),
  rec(12, "Gap matrix row", "pmo", "Applied", 9, "W28"),

  rec(13, "Effort entry", "auditor", "Sign-off", 35, "W29"),
  rec(14, "Effort entry", "reviewer", "Sign-off", 19, "W29"),
  rec(15, "Mapping row", "reviewer", "Sign-off", 7, "W29"),
  rec(16, "Audit event", "auditor", "Sign-off", 21, "W29"),
  rec(17, "Audit event", "reviewer", "Sign-off", 16, "W29"),
  rec(18, "Audit event", "pmo", "Applied", 6, "W29"),

  rec(19, "Gap matrix row", "lead", "Sign-off", 30, "W30"),
  rec(20, "Gap matrix row", "reviewer", "Sign-off", 13, "W30"),
  rec(21, "Mapping row", "reviewer", "Sign-off", 6, "W30"),
  rec(22, "Standard crosswalk", "reviewer", "Sign-off", 18, "W30"),
  rec(23, "Effort entry", "reviewer", "Sign-off", 17, "W30"),
  rec(24, "Effort entry", "pmo", "Applied", 3, "W30"),

  rec(25, "Audit event", "auditor", "Sign-off", 23, "W31"),
  rec(26, "Audit event", "reviewer", "Sign-off", 14, "W31"),
  rec(27, "Mapping row", "reviewer", "Sign-off", 5, "W31"),
  rec(28, "Gap matrix row", "lead", "Sign-off", 20, "W31"),
  rec(29, "Standard crosswalk", "auditor", "Sign-off", 10, "W31"),
  rec(30, "Mapping row", "pmo", "Applied", 7, "W31"),

  rec(31, "Effort entry", "reviewer", "Sign-off", 15, "W32"),
  rec(32, "Effort entry", "auditor", "Sign-off", 18, "W32"),
  rec(33, "Mapping row", "reviewer", "Sign-off", 4, "W32"),
  rec(34, "Audit event", "auditor", "Sign-off", 26, "W32"),
  rec(35, "Gap matrix row", "reviewer", "Sign-off", 11, "W32"),
  rec(36, "Audit event", "pmo", "Applied", 9, "W32"),
];

const roleByName = new Map<string, RoleId>([
  ["Clinical / Quality Reviewer", "reviewer"],
  ["Independent Auditor", "auditor"],
  ["Module Lead", "lead"],
  ["Programme Owner / PMO Lead", "pmo"],
  ["Executive Sponsor", "exec"],
]);

function weekOf(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `W${week}`;
}

/** Turn completed hand-offs on live session requests into SLA records. */
export function liveSlaRecords(requests: CorrectionRequest[]): SlaRecord[] {
  const out: SlaRecord[] = [];
  requests.forEach((r) => {
    let prev = parseStamp(r.requestedAt)?.getTime() ?? null;
    r.history.forEach((h, i) => {
      const at = parseStamp(h.at);
      if (!at) return;
      if ((h.stage === "Sign-off" || h.stage === "Applied") && prev !== null) {
        const stage: SlaStage = h.stage;
        out.push({
          id: `${r.id}-${i}`,
          requestId: r.id,
          mandateType: (mandateTypes as readonly string[]).includes(r.mandateType)
            ? (r.mandateType as MandateType)
            : "Audit event",
          role: roleByName.get(h.role) ?? "reviewer",
          stage,
          hours: (at.getTime() - prev) / 3600000,
          targetHours: slaTargetHours[stage],
          week: weekOf(at),
          live: true,
        });
      }
      prev = at.getTime();
    });
  });
  return out;
}

export interface SlaAggregate {
  key: string;
  label: string;
  count: number;
  breaches: number;
  breachRate: number;
  avgHours: number;
  worstHours: number;
  targetHours: number;
}

function aggregate(key: string, label: string, records: SlaRecord[]): SlaAggregate {
  const count = records.length;
  const breaches = records.filter((r) => r.hours > r.targetHours).length;
  const totalHours = records.reduce((a, r) => a + r.hours, 0);
  return {
    key,
    label,
    count,
    breaches,
    breachRate: count === 0 ? 0 : (breaches / count) * 100,
    avgHours: count === 0 ? 0 : totalHours / count,
    worstHours: count === 0 ? 0 : Math.max(...records.map((r) => r.hours)),
    targetHours:
      count === 0 ? 0 : records.reduce((a, r) => a + r.targetHours, 0) / count,
  };
}

export function overallSla(records: SlaRecord[]) {
  return aggregate("all", "All hand-offs", records);
}

export function byMandateType(records: SlaRecord[]): SlaAggregate[] {
  return mandateTypes
    .map((m) => aggregate(m, m, records.filter((r) => r.mandateType === m)))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.breachRate - a.breachRate || b.avgHours - a.avgHours);
}

export function byReviewerRole(records: SlaRecord[]): SlaAggregate[] {
  const ids = Array.from(new Set(records.map((r) => r.role)));
  return ids
    .map((id) => aggregate(id, roleName(id), records.filter((r) => r.role === id)))
    .sort((a, b) => b.breachRate - a.breachRate || b.avgHours - a.avgHours);
}

export function byStage(records: SlaRecord[]): SlaAggregate[] {
  return (["Sign-off", "Applied"] as SlaStage[])
    .map((s) =>
      aggregate(s, s === "Sign-off" ? "Reviewer sign-off" : "Applied by reversal", records.filter((r) => r.stage === s)),
    )
    .filter((a) => a.count > 0);
}

export interface TrendPoint {
  week: string;
  breachRate: number;
  avgHours: number;
  count: number;
}

export function weeklyTrend(records: SlaRecord[]): TrendPoint[] {
  const weeks = Array.from(new Set([...trendWeeks, ...records.map((r) => r.week)]));
  return weeks
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((week) => {
      const a = aggregate(week, week, records.filter((r) => r.week === week));
      return {
        week,
        breachRate: Math.round(a.breachRate),
        avgHours: Math.round(a.avgHours * 10) / 10,
        count: a.count,
      };
    })
    .filter((p) => p.count > 0);
}

export function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours % 24);
  return rest === 0 ? `${days}d` : `${days}d ${rest}h`;
}

export function breachTone(rate: number): "success" | "warning" | "danger" {
  if (rate >= 40) return "danger";
  if (rate >= 20) return "warning";
  return "success";
}
