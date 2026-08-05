// Concept-only presentation model. Configurable reviewer sign-off rules: each
// mandate type (the kind of object being corrected) can demand a different
// number of countersignatures, restrict them to specific governance roles and
// switch segregation of duties on or off.
import { roleName } from "./permissions";
import type { RoleId } from "./types";

export const mandateTypes = [
  "Effort entry",
  "Mapping row",
  "Gap matrix row",
  "Audit event",
  "Standard crosswalk",
] as const;

export type MandateType = (typeof mandateTypes)[number];

export interface SignOffRule {
  mandateType: MandateType;
  /** Countersignatures required before the correction may be applied. */
  requiredApprovals: number;
  /** Only these mandates may countersign. Empty means any role with the permission. */
  requiredRoles: RoleId[];
  /** When true the actor who raised the request may never countersign it. */
  segregationOfDuties: boolean;
  /** Turnaround target, in hours, for the reviewer sign-off hand-off. */
  signOffTargetHours: number;
  /** Turnaround target, in hours, for applying the reversal after sign-off. */
  applyTargetHours: number;
  note: string;
}

/** Options offered in the rules editor. */
export const signOffTargetOptions = [4, 8, 12, 24, 36, 48, 72] as const;
export const applyTargetOptions = [1, 2, 4, 8, 12, 24] as const;

const baseline: Record<MandateType, SignOffRule> = {
  "Effort entry": {
    mandateType: "Effort entry",
    requiredApprovals: 2,
    requiredRoles: ["reviewer", "auditor"],
    segregationOfDuties: true,
    signOffTargetHours: 24,
    applyTargetHours: 8,
    note: "Financial impact: a reviewer and an auditor must both countersign.",
  },
  "Mapping row": {
    mandateType: "Mapping row",
    requiredApprovals: 1,
    requiredRoles: ["reviewer"],
    segregationOfDuties: true,
    signOffTargetHours: 12,
    applyTargetHours: 4,
    note: "Clinical or quality reviewer sign-off is sufficient.",
  },
  "Gap matrix row": {
    mandateType: "Gap matrix row",
    requiredApprovals: 1,
    requiredRoles: ["reviewer", "lead"],
    segregationOfDuties: true,
    signOffTargetHours: 24,
    applyTargetHours: 8,
    note: "Either the module lead or a reviewer may countersign.",
  },
  "Audit event": {
    mandateType: "Audit event",
    requiredApprovals: 2,
    requiredRoles: ["reviewer", "auditor"],
    segregationOfDuties: true,
    signOffTargetHours: 24,
    applyTargetHours: 8,
    note: "Trail corrections need two independent countersignatures.",
  },
  "Standard crosswalk": {
    mandateType: "Standard crosswalk",
    requiredApprovals: 1,
    requiredRoles: ["reviewer", "auditor"],
    segregationOfDuties: false,
    signOffTargetHours: 48,
    applyTargetHours: 12,
    note: "Editorial crosswalk fix: single sign-off, duties not segregated.",
  },
};

export type SignOffRuleSet = Record<MandateType, SignOffRule>;

export function baselineSignOffRules(): SignOffRuleSet {
  return Object.fromEntries(
    mandateTypes.map((m) => [m, { ...baseline[m], requiredRoles: [...baseline[m].requiredRoles] }]),
  ) as SignOffRuleSet;
}

export function ruleFor(rules: SignOffRuleSet, mandateType: string): SignOffRule {
  return (
    rules[mandateType as MandateType] ?? {
      mandateType: "Audit event",
      requiredApprovals: 1,
      requiredRoles: [],
      segregationOfDuties: true,
      signOffTargetHours: 24,
      applyTargetHours: 8,
      note: "Default rule applied: one countersignature from any authorised reviewer.",
    }
  );
}

/** Turnaround target, in hours, for one stage under a rule. */
export function targetHoursFor(rule: SignOffRule, stage: "Sign-off" | "Applied") {
  return stage === "Sign-off" ? rule.signOffTargetHours : rule.applyTargetHours;
}

/** One-line description of the turnaround targets. */
export function targetsSummary(rule: SignOffRule) {
  return `sign-off ${rule.signOffTargetHours}h · apply ${rule.applyTargetHours}h`;
}

/** One-line description used in the UI and audit reasons. */
export function ruleSummary(rule: SignOffRule) {
  const who =
    rule.requiredRoles.length === 0
      ? "any authorised reviewer"
      : rule.requiredRoles.map(roleName).join(" or ");
  return `${rule.requiredApprovals} sign-off${rule.requiredApprovals === 1 ? "" : "s"} from ${who}${
    rule.segregationOfDuties ? ", segregation of duties enforced" : ", raiser may self-sign"
  }, ${targetsSummary(rule)}`;
}
