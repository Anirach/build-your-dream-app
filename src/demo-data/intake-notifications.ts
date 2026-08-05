import type { RegistryChangeProposalView, RoleId } from "./types";

export type IntakeActivityKind =
  | "proposal.submitted"
  | "proposal.approved"
  | "proposal.rejected"
  | "proposal.validation"
  | "notification.sent";

export interface IntakeActivityItem {
  id: string;
  kind: IntakeActivityKind;
  at: string;
  actor: string;
  proposalId?: string;
  title: string;
  detail: string;
  session: boolean;
}

export type NotificationKind = "review.requested" | "decision.recorded" | "review.reminder";

export interface IntakeNotificationView {
  id: string;
  kind: NotificationKind;
  at: string;
  /** Governance role the notification is addressed to. */
  recipientRole: RoleId;
  recipient: string;
  proposalId: string;
  title: string;
  body: string;
  read: boolean;
  session: boolean;
}

export const notificationKindLabels: Record<NotificationKind, string> = {
  "review.requested": "Review requested",
  "decision.recorded": "Decision recorded",
  "review.reminder": "Reminder",
};

export function activityTone(kind: IntakeActivityKind) {
  if (kind === "proposal.approved") return "success" as const;
  if (kind === "proposal.rejected") return "danger" as const;
  if (kind === "proposal.submitted") return "warning" as const;
  if (kind === "proposal.validation") return "info" as const;
  return "neutral" as const;
}

/* ------------------------------ synthetic seeds ---------------------------- */

export const seedIntakeActivity: IntakeActivityItem[] = [
  {
    id: "act-0007",
    kind: "proposal.submitted",
    at: "3 Aug 2026, 09:14",
    actor: "Farid Hasan",
    proposalId: "PRP-0007",
    title: "Add module proposal raised",
    detail: "MOD-31 Endoscopy Suite raised for owner approval with SOP-114 rev B as the source.",
    session: false,
  },
  {
    id: "act-0006",
    kind: "proposal.validation",
    at: "3 Aug 2026, 09:15",
    actor: "Registry validation agent",
    proposalId: "PRP-0007",
    title: "Validation checks completed",
    detail: "4 checks passed, 1 warning on crosswalk coverage. No registry change applied yet.",
    session: false,
  },
  {
    id: "act-0005",
    kind: "notification.sent",
    at: "3 Aug 2026, 09:15",
    actor: "Notification service",
    proposalId: "PRP-0007",
    title: "Owner notified",
    detail: "Programme owner queue updated: one proposal awaiting approval.",
    session: false,
  },
  {
    id: "act-0004",
    kind: "proposal.approved",
    at: "1 Aug 2026, 16:02",
    actor: "Nabila Chowdhury",
    proposalId: "PRP-0005",
    title: "Amend module proposal approved",
    detail: "MOD-12 renamed to Central Sterile Services; session registry updated.",
    session: false,
  },
  {
    id: "act-0003",
    kind: "proposal.rejected",
    at: "29 Jul 2026, 11:40",
    actor: "Nabila Chowdhury",
    proposalId: "PRP-0003",
    title: "Retire module proposal rejected",
    detail: "Evidence chain for MOD-08 is still open; retire request returned to the requester.",
    session: false,
  },
];

export const seedIntakeNotifications: IntakeNotificationView[] = [
  {
    id: "ntf-0003",
    kind: "review.requested",
    at: "3 Aug 2026, 09:15",
    recipientRole: "pmo",
    recipient: "Nabila Chowdhury",
    proposalId: "PRP-0007",
    title: "PRP-0007 awaiting your approval",
    body: "Farid Hasan proposed adding MOD-31 Endoscopy Suite. One validation warning to review.",
    read: false,
    session: false,
  },
  {
    id: "ntf-0002",
    kind: "review.reminder",
    at: "4 Aug 2026, 08:00",
    recipientRole: "pmo",
    recipient: "Nabila Chowdhury",
    proposalId: "PRP-0007",
    title: "Reminder: PRP-0007 open for 1 day",
    body: "Registry proposals are expected to be decided within two working days in this mockup.",
    read: false,
    session: false,
  },
  {
    id: "ntf-0001",
    kind: "decision.recorded",
    at: "1 Aug 2026, 16:02",
    recipientRole: "lead",
    recipient: "Farid Hasan",
    proposalId: "PRP-0005",
    title: "PRP-0005 approved",
    body: "Nabila Chowdhury approved the amendment. The session registry now shows the new module name.",
    read: true,
    session: false,
  },
];

/* -------------------------------- selectors -------------------------------- */

export function activityForProposal(items: IntakeActivityItem[], proposalId: string) {
  return items.filter((i) => i.proposalId === proposalId);
}

export function notificationsForRole(
  items: IntakeNotificationView[],
  role: RoleId,
  scope: "mine" | "all" = "mine",
) {
  return scope === "all" ? items : items.filter((n) => n.recipientRole === role);
}

export function unreadCount(items: IntakeNotificationView[], role: RoleId) {
  return items.filter((n) => n.recipientRole === role && !n.read).length;
}

export function pendingOlderThanNothing(proposals: RegistryChangeProposalView[]) {
  return proposals.filter((p) => p.status === "Pending owner approval");
}
