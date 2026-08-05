// Concept-only presentation model. Replace through adapters after the
// owner-approved PostgreSQL schema and APIs are available.
import type { Person, RoleId } from "./types";

export const people: Person[] = [
  { id: "p-maya", name: "Dr. Maya Rahman", title: "Clinical Quality Reviewer", fictional: true },
  { id: "p-arif", name: "Dr. Arif Hasan", title: "ICU Module Lead", fictional: true },
  { id: "p-nabila", name: "Nabila Chowdhury", title: "PMO Lead", fictional: true },
  { id: "p-omar", name: "Omar Siddiqui", title: "Facilities Module Lead", fictional: true },
  { id: "p-sara", name: "Sara Karim", title: "Infection Prevention Lead", fictional: true },
  { id: "p-agent", name: "System Agent", title: "Draft Mapping Worker", fictional: false },
  { id: "p-sync", name: "M365 Sync", title: "Integration Actor", fictional: false },
];

export function personName(id: string) {
  return people.find((p) => p.id === id)?.name ?? "Unassigned";
}

export interface RoleDefinition {
  id: RoleId;
  name: string;
  person: string;
  landing: string;
  emphasis: string[];
  focus: string;
}

export const roles: RoleDefinition[] = [
  {
    id: "exec",
    name: "Executive Sponsor",
    person: "Nabila Chowdhury",
    landing: "/",
    emphasis: ["/", "/programme", "/audit"],
    focus: "Programme health, top risks, overdue decisions.",
  },
  {
    id: "pmo",
    name: "Programme Owner / PMO Lead",
    person: "Nabila Chowdhury",
    landing: "/programme",
    emphasis: ["/programme", "/reviews", "/gap-analysis", "/audit"],
    focus: "All module status, schedule, risk and review workload.",
  },
  {
    id: "lead",
    name: "Module Lead",
    person: "Dr. Arif Hasan",
    landing: "/programme/modules/M03",
    emphasis: ["/programme/modules/M03", "/workbench", "/gap-analysis"],
    focus: "My module condition, deliverables, evidence gaps.",
  },
  {
    id: "reviewer",
    name: "Clinical / Quality Reviewer",
    person: "Dr. Maya Rahman",
    landing: "/reviews",
    emphasis: ["/reviews", "/standards", "/gap-analysis"],
    focus: "Focused review queue with source and mapping context.",
  },
  {
    id: "auditor",
    name: "Auditor / System Steward",
    person: "Dr. Maya Rahman",
    landing: "/audit",
    emphasis: ["/audit", "/standards", "/programme"],
    focus: "Complete lineage, actor attribution, immutable history.",
  },
];