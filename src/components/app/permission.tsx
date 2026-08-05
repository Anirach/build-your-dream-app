import { Lock } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { toast } from "sonner";

import { NoticeBanner } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { permissionLabels, rolesWith, type Permission } from "@/demo-data/permissions";
import { useDemoState } from "@/demo-data/store";

/** Button that is only enabled when the active role holds the permission. */
export function PermissionButton({
  permission,
  children,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Button>, "asChild"> & {
  permission: Permission;
  children: ReactNode;
}) {
  const { can, denialReason } = useDemoState();
  const allowed = can(permission);
  const reason = denialReason(permission);

  const button = (
    <Button
      {...props}
      aria-disabled={!allowed || props.disabled ? true : undefined}
      disabled={props.disabled}
      title={allowed ? props.title : reason}
      onClick={(event) => {
        if (!allowed) {
          event.preventDefault();
          toast.error("Not authorised", { description: reason });
          return;
        }
        onClick?.(event);
      }}
      className={props.className}
    >
      {!allowed && <Lock className="size-3.5" aria-hidden />}
      {children}
    </Button>
  );

  if (allowed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{reason}</TooltipContent>
    </Tooltip>
  );
}

/** Inline badge showing whether the active role may perform an action. */
export function PermissionBadge({ permission }: { permission: Permission }) {
  const { can } = useDemoState();
  const allowed = can(permission);
  return (
    <StatusBadge
      label={allowed ? "Authorised" : "Read only"}
      tone={allowed ? "success" : "neutral"}
      title={
        allowed
          ? `Your role may ${permissionLabels[permission].toLowerCase()}.`
          : `Permitted roles: ${rolesWith(permission).join(", ") || "none"}.`
      }
    />
  );
}

/**
 * Banner explaining what the active role may and may not do on this screen.
 * Pass the permissions the screen's write actions require.
 */
export function RoleAccessNotice({ permissions }: { permissions: Permission[] }) {
  const { can, roleLabel } = useRoleLabel();
  const granted = permissions.filter((p) => can(p));
  const blocked = permissions.filter((p) => !can(p));

  if (blocked.length === 0) {
    return (
      <NoticeBanner tone="info">
        Signed in as <strong>{roleLabel}</strong>. Your role is authorised for every decision on this
        screen. All actions are attributed to you in the audit trail.
      </NoticeBanner>
    );
  }

  return (
    <NoticeBanner tone="warning">
      Signed in as <strong>{roleLabel}</strong>.{" "}
      {granted.length === 0
        ? "Your role has read-only access to the decisions on this screen."
        : `Your role may ${granted.map((p) => permissionLabels[p].toLowerCase()).join(", ")}.`}{" "}
      Blocked here: {blocked.map((p) => permissionLabels[p].toLowerCase()).join(", ")}. Blocked
      attempts are recorded in the audit trail. Use the role switcher to demonstrate another
      mandate.
    </NoticeBanner>
  );
}

function useRoleLabel() {
  const { can, role, actor } = useDemoState();
  const label = `${actor}`;
  return { can, roleLabel: label, role };
}
