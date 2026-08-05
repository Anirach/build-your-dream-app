// Configurable reviewer sign-off rules editor. Session-only, gated by roles.manage.
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { roles } from "@/demo-data/people";
import { useDemoState } from "@/demo-data/store";
import {
  applyTargetOptions,
  mandateTypes,
  ruleSummary,
  signOffTargetOptions,
} from "@/demo-data/signoff-rules";
import type { RoleId } from "@/demo-data/types";

export function SignOffRulesCard() {
  const { can, signOffRules, setSignOffRule, resetSignOffRules } = useDemoState();
  const editable = can("roles.manage");

  return (
    <SectionCard
      title="Reviewer sign-off rules"
      description="Each mandate type can demand a different number of countersignatures, restrict them to named roles, switch segregation of duties on or off and set its own turnaround targets. Rules are snapshotted onto a correction when it is raised."
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge label={editable ? "Editable" : "Read only"} tone={editable ? "success" : "neutral"} />
          <PermissionButton
            permission="roles.manage"
            size="sm"
            variant="outline"
            onClick={() => {
              if (resetSignOffRules()) {
                toast.success("Baseline sign-off rules restored");
              }
            }}
          >
            <RotateCcw className="size-3.5" aria-hidden /> Reset rules
          </PermissionButton>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {mandateTypes.map((m) => {
          const rule = signOffRules[m];
          return (
            <div key={m} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{m}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rule.note}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge
                    label={`${rule.requiredApprovals} sign-off${rule.requiredApprovals === 1 ? "" : "s"}`}
                    tone={rule.requiredApprovals > 1 ? "info" : "neutral"}
                  />
                  <StatusBadge
                    label={`${rule.signOffTargetHours}h / ${rule.applyTargetHours}h`}
                    tone="neutral"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    htmlFor={`approvals-${m}`}
                  >
                    Required countersignatures
                  </label>
                  <Select
                    value={String(rule.requiredApprovals)}
                    disabled={!editable}
                    onValueChange={(v) => {
                      if (setSignOffRule(m, { requiredApprovals: Number(v) })) {
                        toast.success("Sign-off rule updated", {
                          description: `${m}: ${v} countersignature(s) required.`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id={`approvals-${m}`} aria-label={`Required sign-offs for ${m}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} reviewer{n === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Segregation of duties
                  </p>
                  <div className="flex items-center gap-2 pt-1.5">
                    <Switch
                      checked={rule.segregationOfDuties}
                      disabled={!editable}
                      aria-label={`Segregation of duties for ${m}`}
                      onCheckedChange={(next) => {
                        if (setSignOffRule(m, { segregationOfDuties: next })) {
                          toast.success("Sign-off rule updated", {
                            description: `${m}: raiser ${next ? "cannot" : "may"} countersign.`,
                          });
                        }
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {rule.segregationOfDuties ? "Raiser excluded" : "Raiser may self-sign"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    htmlFor={`sla-signoff-${m}`}
                  >
                    Sign-off target
                  </label>
                  <Select
                    value={String(rule.signOffTargetHours)}
                    disabled={!editable}
                    onValueChange={(v) => {
                      if (setSignOffRule(m, { signOffTargetHours: Number(v) })) {
                        toast.success("Turnaround target updated", {
                          description: `${m}: reviewer sign-off within ${v}h.`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id={`sla-signoff-${m}`} aria-label={`Sign-off target for ${m}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {signOffTargetOptions.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    htmlFor={`sla-apply-${m}`}
                  >
                    Apply target
                  </label>
                  <Select
                    value={String(rule.applyTargetHours)}
                    disabled={!editable}
                    onValueChange={(v) => {
                      if (setSignOffRule(m, { applyTargetHours: Number(v) })) {
                        toast.success("Turnaround target updated", {
                          description: `${m}: reversal applied within ${v}h of sign-off.`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id={`sla-apply-${m}`} aria-label={`Apply target for ${m}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {applyTargetOptions.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Roles permitted to countersign
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const on = rule.requiredRoles.includes(r.id as RoleId);
                    return (
                      <Toggle
                        key={r.id}
                        size="sm"
                        variant="outline"
                        pressed={on}
                        disabled={!editable}
                        aria-label={`${r.name} may countersign ${m}`}
                        onPressedChange={(next) => {
                          const requiredRoles = next
                            ? [...rule.requiredRoles, r.id]
                            : rule.requiredRoles.filter((x) => x !== r.id);
                          if (setSignOffRule(m, { requiredRoles })) {
                            toast.success("Sign-off rule updated", {
                              description: `${m}: ${r.name} ${next ? "may" : "may no longer"} countersign.`,
                            });
                          }
                        }}
                      >
                        {r.name}
                      </Toggle>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {rule.requiredRoles.length === 0
                    ? "No role selected: any mandate holding the sign-off permission may countersign."
                    : ruleSummary(rule)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
