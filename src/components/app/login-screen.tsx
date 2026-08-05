import { useRouter } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { roles } from "@/demo-data/people";
import { rolePermissions } from "@/demo-data/permissions";
import { useDemoState } from "@/demo-data/store";
import type { RoleId } from "@/demo-data/types";
import { cn } from "@/lib/utils";

/** Sample accounts for the mockup. No real credentials are checked. */
const sampleAccounts: { role: RoleId; login: string; note: string }[] = [
  { role: "auditor", login: "admin@bdms.demo", note: "Administrator / System Steward" },
  { role: "pmo", login: "pmo@bdms.demo", note: "Programme Owner" },
  { role: "reviewer", login: "reviewer@bdms.demo", note: "Clinical / Quality Reviewer" },
  { role: "lead", login: "lead@bdms.demo", note: "Module Lead" },
  { role: "exec", login: "exec@bdms.demo", note: "Executive Sponsor" },
];

export function LoginScreen() {
  const { signIn, roleAssignments } = useDemoState();
  const router = useRouter();
  const [selected, setSelected] = useState<RoleId>("auditor");

  const account = sampleAccounts.find((a) => a.role === selected)!;
  const roleDef = roles.find((r) => r.id === selected)!;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    signIn(selected);
    toast.success(`Signed in as ${roleDef.name}`, { description: roleDef.focus });
    void router.navigate({ to: roleDef.landing });
  }

  return (
    <div className="grid min-h-screen bg-sidebar lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-10 text-navy-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-navy-foreground/15 text-[11px] font-bold">
            BD
          </span>
          <span className="text-sm font-semibold">BDMS Intelligence</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-semibold">Commissioning readiness, governed end to end</h2>
          <p className="text-sm text-navy-foreground/80">
            Role-based mandates, rule-calculated RAG status and an append-only audit trail. Choose a
            sample account to explore how each mandate sees the programme.
          </p>
          <p className="inline-flex items-center gap-2 rounded-md bg-navy-foreground/10 px-3 py-1.5 text-xs font-semibold">
            <ShieldCheck className="size-4" aria-hidden /> Concept mockup - synthetic data only
          </p>
        </div>
        <p className="text-xs text-navy-foreground/60">
          SHSIRC - Dhaka / Baseline BL0 - SCH-001
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <h1 className="text-xl font-semibold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a sample role account to test the system. Passwords are not checked in this
            mockup.
          </p>

          <fieldset className="mt-5 space-y-2">
            <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Sample accounts
            </legend>
            {sampleAccounts.map((a) => {
              const def = roles.find((r) => r.id === a.role)!;
              const active = a.role === selected;
              return (
                <label
                  key={a.role}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-soft-blue"
                      : "border-border hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="account"
                    value={a.role}
                    checked={active}
                    onChange={() => setSelected(a.role)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-navy">{a.note}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.login} · {roleAssignments[a.role] ?? def.person}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="mt-4 space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password (any value)
            </label>
            <input
              id="password"
              type="password"
              defaultValue="demo"
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            {roleDef.name} holds {rolePermissions[selected].length} of the mandate permissions and
            lands on {roleDef.landing}.
          </p>

          <Button type="submit" className="mt-4 w-full gap-2">
            <LogIn className="size-4" aria-hidden /> Sign in as {roleDef.name}
          </Button>
        </form>
      </div>
    </div>
  );
}
