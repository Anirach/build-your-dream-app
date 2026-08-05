// Concept-only turnaround maths for the correction workflow. Timestamps are the
// same "3 Aug 2026, 16:40" strings the demo store writes, so they are parsed
// back into dates locally rather than fetched from anywhere.
import type { CorrectionRequest, CorrectionStep } from "./corrections";

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** Parse "3 Aug 2026, 16:40" (the format used across the demo). */
export function parseStamp(stamp: string): Date | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/.exec(stamp.trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!.slice(0, 3).toLowerCase());
  if (month < 0) return null;
  return new Date(
    Number(m[3]),
    month,
    Number(m[1]),
    Number(m[4]),
    Number(m[5]),
  );
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rMins = mins % 60;
  if (hours < 24) return rMins === 0 ? `${hours}h` : `${hours}h ${rMins}m`;
  const days = Math.floor(hours / 24);
  const rHours = hours % 24;
  return rHours === 0 ? `${days}d` : `${days}d ${rHours}h`;
}

/** Synthetic turnaround targets, in hours, for each hand-off. */
export const slaTargetHours: Record<"Sign-off" | "Applied", number> = {
  "Sign-off": 24,
  Applied: 8,
};

export type SlaTone = "success" | "warning" | "danger" | "neutral";

export interface TimelineRow {
  key: string;
  stage: CorrectionStep["stage"] | "Pending";
  label: string;
  actor: string;
  role: string;
  at: string;
  note: string;
  /** Time since the previous stage, in ms. */
  elapsedMs: number | null;
  targetHours: number | null;
  tone: SlaTone;
  pending: boolean;
}

function tone(elapsedMs: number | null, targetHours: number | null): SlaTone {
  if (elapsedMs === null || targetHours === null) return "neutral";
  const target = targetHours * 3600000;
  if (elapsedMs > target) return "danger";
  if (elapsedMs > target * 0.75) return "warning";
  return "success";
}

/** Build the stage-by-stage timeline, including the open stage still running. */
export function buildTimeline(request: CorrectionRequest, nowMs: number): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let prev: number | null = null;

  request.history.forEach((h, i) => {
    const at = parseStamp(h.at);
    const target =
      h.stage === "Sign-off"
        ? slaTargetHours["Sign-off"]
        : h.stage === "Applied"
          ? slaTargetHours.Applied
          : null;
    const elapsedMs = at && prev !== null ? at.getTime() - prev : null;
    rows.push({
      key: `${request.id}-${i}`,
      stage: h.stage,
      label:
        h.stage === "Requested"
          ? "Requested"
          : h.stage === "Sign-off"
            ? "Reviewer sign-off"
            : h.stage === "Applied"
              ? "Applied by reversal"
              : "Rejected",
      actor: h.actor,
      role: h.role,
      at: h.at,
      note: h.note,
      elapsedMs,
      targetHours: elapsedMs === null ? null : target,
      tone: elapsedMs === null ? "neutral" : tone(elapsedMs, target),
      pending: false,
    });
    if (at) prev = at.getTime();
  });

  if (request.status === "Awaiting sign-off" || request.status === "Signed off") {
    const stage = request.status === "Awaiting sign-off" ? "Sign-off" : "Applied";
    const target = slaTargetHours[stage];
    const elapsedMs = prev === null ? null : nowMs - prev;
    rows.push({
      key: `${request.id}-pending`,
      stage: "Pending",
      label: stage === "Sign-off" ? "Awaiting reviewer sign-off" : "Awaiting application",
      actor: "—",
      role:
        stage === "Sign-off"
          ? `Needs ${Math.max(request.rule.requiredApprovals - request.signOffs.length, 0)} more countersignature(s)`
          : "Ready to apply as a reversal",
      at: "In progress",
      note: "",
      elapsedMs,
      targetHours: target,
      tone: tone(elapsedMs, target),
      pending: true,
    });
  }

  return rows;
}

export interface SlaSummary {
  /** Total time from request to the last recorded stage (or now, if open). */
  totalMs: number | null;
  /** Time the currently open stage has been waiting, if any. */
  openMs: number | null;
  targetHours: number | null;
  tone: SlaTone;
  label: string;
  breached: boolean;
}

/** Headline SLA indicator for one request. */
export function slaSummary(request: CorrectionRequest, nowMs: number): SlaSummary {
  const rows = buildTimeline(request, nowMs);
  const start = parseStamp(request.requestedAt);
  const open = rows.find((r) => r.pending);
  const closed = !open;
  const lastAt = [...rows].reverse().find((r) => !r.pending && parseStamp(r.at));
  const endMs = closed
    ? (lastAt ? parseStamp(lastAt.at)!.getTime() : null)
    : nowMs;
  const totalMs = start && endMs !== null ? endMs - start.getTime() : null;

  if (open) {
    const label =
      open.elapsedMs === null
        ? "Turnaround unavailable"
        : `${formatDuration(open.elapsedMs)} in stage · target ${open.targetHours}h`;
    return {
      totalMs,
      openMs: open.elapsedMs,
      targetHours: open.targetHours,
      tone: open.tone,
      label,
      breached: open.tone === "danger",
    };
  }

  const breachedStage = rows.some((r) => r.tone === "danger");
  return {
    totalMs,
    openMs: null,
    targetHours: null,
    tone: breachedStage ? "warning" : "success",
    label:
      totalMs === null
        ? "Closed"
        : `Closed in ${formatDuration(totalMs)}${breachedStage ? " · a stage breached target" : " · within target"}`,
    breached: breachedStage,
  };
}
