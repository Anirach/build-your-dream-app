import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import { PermissionButton, RoleAccessNotice } from "@/components/app/permission";
import { SignOffRulesCard } from "@/components/app/signoff-rules";
import {
  DemoDownloadButton,
  MetricCard,
  NoticeBanner,
  SectionCard,
} from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { people, roles } from "@/demo-data/people";
import { allPermissions, baselineMatrix, permissionLabels } from "@/demo-data/permissions";
import { useDemoState } from "@/demo-data/store";

const TITLE = "Role management - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Assign fictional actors to governance roles and adjust the simulated permission matrix. Every change is appended to the synthetic audit trail.";

export const Route = createFileRoute("/roles/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const assignable = people.filter((p) => p.fictional).map((p) => p.name);

function Page() {
  const {
    can,
    permissionMatrix,
    setRolePermission,
    resetRolePermissions,
    roleAssignments,
    assignRoleActor,
    role: activeRole,
  } = useDemoState();

  const baseline = baselineMatrix();
  const editable = can("roles.manage");
  const changed = roles.filter(
    (r) =>
      permissionMatrix[r.id].length !== baseline[r.id].length ||
      permissionMatrix[r.id].some((p) => !baseline[r.id].includes(p)),
  ).length;
  const grantTotal = roles.reduce((sum, r) => sum + permissionMatrix[r.id].length, 0);

  const csv = [
    "role,actor,permission,granted",
    ...roles.flatMap((r) =>
      allPermissions.map((p) =>
        [r.name, roleAssignments[r.id], permissionLabels[p], permissionMatrix[r.id].includes(p) ? "yes" : "no"]
          .map((v) => `"${v}"`)
          .join(","),
      ),
    ),
  ].join("\n");

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Role management" }]}
        title="Role management"
        subtitle="Assign actors to governance roles and tune which decisions each mandate may take. Simulated access control only: changes live in this browser session."
        secondary={
          <DemoDownloadButton
            filename="synthetic-role-matrix.csv"
            content={csv}
            label="Export matrix"
          />
        }
      />

      <div className="mb-4">
        <RoleAccessNotice permissions={["roles.manage"]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Roles" value={roles.length} hint="Governance mandates in this mockup" />
        <MetricCard
          label="Permissions"
          value={allPermissions.length}
          hint="Distinct gated actions across the app"
        />
        <MetricCard label="Active grants" value={grantTotal} hint="Role and permission pairs enabled" />
        <MetricCard
          label="Roles changed this session"
          value={changed}
          hint="Differs from the baseline mandate"
        />
      </div>

      <div className="mt-6 space-y-6">
        <SectionCard
          title="Role assignments"
          description="Who currently holds each mandate. Reassignment is attributed to you in the audit trail."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{r.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.focus}</p>
                  </div>
                  {activeRole === r.id ? (
                    <StatusBadge label="Active role" tone="info" />
                  ) : null}
                </div>
                <div className="mt-3 space-y-1.5">
                  <label
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    htmlFor={`assign-${r.id}`}
                  >
                    Assigned actor
                  </label>
                  <Select
                    value={roleAssignments[r.id]}
                    disabled={!editable}
                    onValueChange={(value) => {
                      if (assignRoleActor(r.id, value)) {
                        toast.success("Role reassigned", {
                          description: `${r.name} is now held by ${value} (session only).`,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id={`assign-${r.id}`} aria-label={`Assign ${r.name}`}>
                      <SelectValue placeholder="Select an actor" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignable.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="tnum text-xs text-muted-foreground">
                    {permissionMatrix[r.id].length} of {allPermissions.length} permissions granted
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Permission matrix"
          description="Toggle a permission to change what a role may decide. Denied attempts elsewhere in the app are recorded, never applied."
          actions={<StatusBadge label={editable ? "Editable" : "Read only"} tone={editable ? "success" : "neutral"} />}
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64">Permission</TableHead>
                  {roles.map((r) => (
                    <TableHead key={r.id} className="text-center">
                      {r.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPermissions.map((p) => (
                  <TableRow key={p}>
                    <TableCell className="align-top">
                      <p className="text-sm font-medium text-navy">{permissionLabels[p]}</p>
                      <p className="tnum text-xs text-muted-foreground">{p}</p>
                    </TableCell>
                    {roles.map((r) => {
                      const granted = permissionMatrix[r.id].includes(p);
                      return (
                        <TableCell key={r.id} className="text-center">
                          <Switch
                            checked={granted}
                            disabled={!editable}
                            aria-label={`${permissionLabels[p]} for ${r.name}`}
                            onCheckedChange={(next) => {
                              if (setRolePermission(r.id, p, next)) {
                                toast.success(next ? "Permission granted" : "Permission revoked", {
                                  description: `${r.name}: ${permissionLabels[p]}.`,
                                });
                              }
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="text-xs text-muted-foreground">
                    Restore the baseline mandate
                  </TableCell>
                  {roles.map((r) => (
                    <TableCell key={r.id} className="text-center">
                      <PermissionButton
                        permission="roles.manage"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (resetRolePermissions(r.id)) {
                            toast.success("Baseline restored", { description: r.name });
                          }
                        }}
                      >
                        <RotateCcw className="size-3.5" aria-hidden /> Reset
                      </PermissionButton>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        <SignOffRulesCard />

        <NoticeBanner
          tone="warning"
          icon={<ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
        >
          <span className="font-semibold">Simulated access control. </span>
          This matrix is enforced only in the mockup's local state and resets when the demo session is
          reset. Production enforcement must live in server-side policies with an approved identity
          provider.
        </NoticeBanner>
      </div>
    </>
  );
}