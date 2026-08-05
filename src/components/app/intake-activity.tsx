import { Link } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  activityForProposal,
  activityTone,
  notificationKindLabels,
} from "@/demo-data/intake-notifications";
import { useDemoState } from "@/demo-data/store";
import { roleName } from "@/demo-data/permissions";
import { cn } from "@/lib/utils";

/** Feed of proposal reviews and decisions, session events first. */
export function ProposalActivityFeed({
  proposalId,
  limit = 12,
}: {
  proposalId?: string;
  limit?: number;
}) {
  const { intakeActivity } = useDemoState();
  const [scope, setScope] = useState<"all" | "session">("all");

  const scoped = proposalId ? activityForProposal(intakeActivity, proposalId) : intakeActivity;
  const items = (scope === "session" ? scoped.filter((i) => i.session) : scoped).slice(0, limit);

  return (
    <SectionCard
      title={proposalId ? "Proposal activity" : "Proposal activity feed"}
      description={
        proposalId
          ? "Every review step and decision recorded against this proposal."
          : "Submissions, validation runs, owner decisions and notifications across the registry queue."
      }
      actions={
        <Tabs value={scope} onValueChange={(v) => setScope(v as "all" | "session")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="session">This session</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description={
            scope === "session"
              ? "Submit or decide a registry proposal in this session to see it appear here."
              : "Registry proposal activity will appear here."
          }
        />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {items.map((i) => (
            <li key={i.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ring-4 ring-card",
                  i.kind === "proposal.approved"
                    ? "bg-success"
                    : i.kind === "proposal.rejected"
                      ? "bg-danger"
                      : i.kind === "proposal.submitted"
                        ? "bg-warning"
                        : "bg-muted-foreground",
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-navy">{i.title}</p>
                <StatusBadge label={i.kind.replace("proposal.", "").replace("notification.", "")} tone={activityTone(i.kind)} />
                {i.session && <StatusBadge label="This session" tone="info" />}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{i.detail}</p>
              <p className="tnum mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <History className="size-3.5" aria-hidden /> {i.at} · {i.actor}
                {i.proposalId && !proposalId && (
                  <Link
                    to="/data-intake/proposals/$proposalId"
                    params={{ proposalId: i.proposalId }}
                    className="font-medium text-clinical underline-offset-2 hover:underline"
                  >
                    {i.proposalId}
                  </Link>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

/** Owner and requester inbox for the active role. */
export function OwnerNotificationsCard() {
  const {
    intakeNotifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    remindProposalOwner,
    proposals,
    role,
    actor,
  } = useDemoState();
  const [scope, setScope] = useState<"mine" | "all">("mine");

  const items =
    scope === "mine"
      ? intakeNotifications.filter((n) => n.recipientRole === role)
      : intakeNotifications;
  const pending = proposals.filter((p) => p.status === "Pending owner approval");

  return (
    <SectionCard
      title="Owner notifications"
      description={`Routed by role, not by person. Signed in as ${actor} (${roleName(role)}).`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={`${unreadNotifications} unread for ${roleName(role)}`}
            tone={unreadNotifications > 0 ? "warning" : "neutral"}
          />
          <Tabs value={scope} onValueChange={(v) => setScope(v as "mine" | "all")}>
            <TabsList>
              <TabsTrigger value="mine">My queue</TabsTrigger>
              <TabsTrigger value="all">All roles</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            disabled={unreadNotifications === 0}
            onClick={() => {
              markAllNotificationsRead();
              toast.success("Notifications marked read", {
                description: `Cleared the unread badge for ${roleName(role)}.`,
              });
            }}
          >
            <CheckCheck className="size-4" aria-hidden /> Mark all read
          </Button>
        </div>
      }
    >
      {pending.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <BellRing className="size-4 text-warning" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {pending.length} proposal{pending.length === 1 ? "" : "s"} awaiting owner approval.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sent = pending.filter((p) => remindProposalOwner(p.id)).length;
              toast.success("Reminder sent", {
                description: `${sent} reminder notification(s) delivered to the approver roles.`,
              });
            }}
          >
            Remind owner
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          description="Notifications appear when a proposal is submitted for review or decided."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-lg border p-4",
                n.read ? "border-border" : "border-clinical/40 bg-clinical/5",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
                    <Bell className="size-4 text-clinical" aria-hidden /> {n.title}
                    {!n.read && <StatusBadge label="Unread" tone="warning" />}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="tnum mt-1 text-xs text-muted-foreground">
                    {notificationKindLabels[n.kind]} · to {n.recipient} ({roleName(n.recipientRole)})
                    · {n.at}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markNotificationRead(n.id, !n.read)}
                  >
                    {n.read ? "Mark unread" : "Mark read"}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/data-intake/proposals/$proposalId"
                      params={{ proposalId: n.proposalId }}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      Open proposal
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
