// Concept-only presentation model. Simulated role-based access control for the
// mockup. Replace with server-enforced policies once the owner-approved
// PostgreSQL schema, APIs and identity provider are available.
import { roles } from "./people";
import type { RoleId } from "./types";

export type Permission =
  | "mapping.approve"
  | "mapping.edit"
  | "mapping.reject"
  | "review.complete"
  | "review.reassign"
  | "gap.approve"
  | "gap.return"
  | "scenario.run"
  | "scenario.select"
  | "audit.correct";

export const permissionLabels: Record<Permission, string> = {
  "mapping.approve": "Approve clause mappings",
  "mapping.edit": "Edit clause mappings",
  "mapping.reject": "Reject clause mappings",
  "review.complete": "Complete a review and issue an audit reference",
  "review.reassign": "Reassign review items",
  "gap.approve": "Approve gap matrix rows",
  "gap.return": "Return gap matrix rows for correction",
  "scenario.run": "Run and save gap scenarios",
  "scenario.select": "Select the preferred gap scenario",
  "audit.correct": "Record a correction by reversal on the audit trail",
};

/**
 * Deny by default. Each role only receives the permissions its governance
 * mandate requires.
 */
export const rolePermissions: Record<RoleId, Permission[]> = {
  exec: [],
  pmo: ["review.reassign", "scenario.run", "scenario.select", "audit.correct"],
  lead: ["gap.return", "scenario.run"],
  reviewer: [
    "mapping.approve",
    "mapping.edit",
    "mapping.reject",
    "review.complete",
    "gap.approve",
    "gap.return",
    "scenario.run",
  ],
  auditor: ["audit.correct"],
};

export function can(role: RoleId, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function roleName(role: RoleId) {
  return roles.find((r) => r.id === role)?.name ?? role;
}

export function actorFor(role: RoleId) {
  return roles.find((r) => r.id === role)?.person ?? "Unknown actor";
}

/** Roles allowed to perform a permission, for denial messaging. */
export function rolesWith(permission: Permission) {
  return (Object.keys(rolePermissions) as RoleId[])
    .filter((r) => can(r, permission))
    .map(roleName);
}

export function denialMessage(role: RoleId, permission: Permission) {
  const allowed = rolesWith(permission);
  return `${roleName(role)} is not authorised to ${permissionLabels[permission].toLowerCase()}. ${
    allowed.length === 0
      ? "No role in this mockup holds that permission."
      : `Permitted roles: ${allowed.join(", ")}.`
  }`;
}
