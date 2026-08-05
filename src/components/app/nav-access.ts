// Concept-only presentation model: which destinations each governance role sees.
// Replace with server-enforced route authorisation once identity and APIs exist.
import type { RoleId } from "@/demo-data/types";

export const roleNavAccess: Record<RoleId, string[]> = {
  exec: ["/", "/programme", "/standards", "/audit", "/sla-analytics", "/data-intake"],
  pmo: [
    "/",
    "/programme",
    "/standards",
    "/workbench",
    "/reviews",
    "/gap-analysis",
    "/audit",
    "/data-intake",
    "/sla-analytics",
    "/roles",
  ],
  lead: ["/", "/programme", "/standards", "/workbench", "/gap-analysis", "/data-intake"],
  reviewer: [
    "/",
    "/programme",
    "/standards",
    "/workbench",
    "/reviews",
    "/gap-analysis",
    "/audit",
    "/data-intake",
  ],
  auditor: ["/", "/programme", "/standards", "/audit", "/sla-analytics", "/roles", "/data-intake"],
};

/** True when the role's mandate includes this destination (or a child of it). */
export function roleCanView(role: RoleId, pathname: string) {
  return roleNavAccess[role].some((allowed) =>
    allowed === "/" ? pathname === "/" : pathname === allowed || pathname.startsWith(`${allowed}/`),
  );
}
