// Tab A: Roadmap and acceptance gates. Concept-only; no production evidence.
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { KeyValue, NoticeBanner, SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { evidenceStateTone, isGateReady } from "@/demo-data/evidence-register";
import {
  openDecisions,
  packetDisplayState,
  readinessPackets,
  truthModel,
  type PacketDisplayState,
  type PacketId,
} from "@/demo-data/readiness";
import { useDemoState } from "@/demo-data/store";
import { cn } from "@/lib/utils";

function displayTone(state: PacketDisplayState) {
  if (state === "Accepted") return "success" as const;
  if (state === "Active") return "info" as const;
  return "neutral" as const;
}

export function ReadinessRoadmap() {
  const {
    acceptedPackets,
    packetAttestations,
    attestPacket,
    requestPacketAttestation,
    acceptPacket,
    acceptanceBlockers,
    acceptanceHistory,
    evidenceRegister,
  } = useDemoState();
  const [selected, setSelected] = useState<PacketId>("sprint-0");
  const [reason, setReason] = useState("");

  const packet = readinessPackets.find((p) => p.id === selected)!;
  const state = packetDisplayState(packet.id, acceptedPackets);
  const attestation = packetAttestations[packet.id];
  const blockers = acceptanceBlockers(packet.id);

  return (
    <div className="space-y-6">
      <NoticeBanner icon={<ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />}>
        A working mock screen is not production acceptance. Every packet below tracks two separate
        judgements: what the mockup demonstrates, and what a production owner has accepted against
        real evidence. All data on this page is synthetic.
      </NoticeBanner>

      <SectionCard
        title="Delivery packets and acceptance gates"
        description="Work in progress is limited to one active packet. A packet only unlocks once every prior gate is accepted."
      >
        <ol className="grid gap-3 lg:grid-cols-5">
          {readinessPackets.map((p) => {
            const s = packetDisplayState(p.id, acceptedPackets);
            const active = p.id === selected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "h-full w-full rounded-lg border p-3 text-left transition-colors",
                    active ? "border-primary bg-soft-blue" : "border-border hover:bg-secondary",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">{p.code}</span>
                    <StatusBadge label={s} tone={displayTone(s)} />
                  </span>
                  <span className="mt-1.5 block text-sm font-medium text-navy">{p.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Mock: {p.mockCapability} · Acceptance: {p.productionAcceptance}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title={`${packet.code} - ${packet.name}`}
          description={packet.acceptanceGate}
          actions={<StatusBadge label={state} tone={displayTone(state)} />}
        >
          <KeyValue
            items={[
              { label: "Owner", value: `${packet.owner} (${packet.ownerRole})` },
              { label: "Reviewer", value: `${packet.reviewer} (${packet.reviewerRole})` },
              { label: "Planned", value: `${packet.plannedStart} - ${packet.plannedEnd}` },
              { label: "Actual", value: packet.actual },
              { label: "Heartbeat", value: packet.heartbeat },
              { label: "Dependencies", value: packet.dependencies.join("; ") || "None" },
            ]}
          />

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                In scope
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {packet.scope.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Explicitly out of scope
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {packet.exclusions.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acceptance criteria
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {packet.acceptanceCriteria.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mandatory evidence
          </h3>
          <div className="mt-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artifact</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packet.requiredEvidence.map((id) => {
                  const artifact = evidenceRegister.find((a) => a.id === id);
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">
                        {id} · {artifact?.title ?? "Unknown artifact"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {artifact?.owner ?? "-"}
                      </TableCell>
                      <TableCell>
                        {artifact ? (
                          <StatusBadge
                            label={artifact.state}
                            tone={evidenceStateTone(artifact.state)}
                            title={
                              isGateReady(artifact.state)
                                ? "Counts towards this acceptance gate"
                                : "Blocks this acceptance gate"
                            }
                          />
                        ) : (
                          <StatusBadge label="Missing" tone="danger" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {packet.blockers.length > 0 && (
            <div className="mt-5">
              <NoticeBanner tone="warning">
                <p className="font-semibold">Recorded blockers</p>
                <ul className="mt-1 space-y-1">
                  {packet.blockers.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </NoticeBanner>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Attest and accept"
          description="Attestation and acceptance are separate acts by different actors. Reasons are mandatory and appended to the audit trail."
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Owner attestation
              </p>
              {attestation ? (
                <p className="mt-1.5">
                  Attested by <span className="font-medium">{attestation.actor}</span> on{" "}
                  {attestation.at}. Reason: {attestation.reason}
                </p>
              ) : (
                <p className="mt-1.5 text-muted-foreground">
                  Not attested. {packet.owner} must confirm the inputs are complete.
                </p>
              )}
            </div>

            <label htmlFor="packet-reason" className="block text-xs font-medium text-muted-foreground">
              Reason (mandatory)
            </label>
            <textarea
              id="packet-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this packet ready, or why are you accepting it?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <PermissionButton
                permission="readiness.update"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!reason.trim()) {
                    toast.error("A reason is required");
                    return;
                  }
                  if (attestPacket(packet.id, reason.trim())) {
                    toast.success(`${packet.code} attested`, { description: "Simulated attestation appended to the audit trail." });
                    setReason("");
                  }
                }}
              >
                Attest readiness
              </PermissionButton>
              <PermissionButton
                permission="readiness.update"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (requestPacketAttestation(packet.id)) {
                    toast.success("Attestation requested", { description: `${packet.owner} notified (simulated).` });
                  }
                }}
              >
                Request attestation
              </PermissionButton>
            </div>

            {blockers.length > 0 ? (
              <NoticeBanner tone="warning">
                <p className="font-semibold">Acceptance is blocked</p>
                <ul className="mt-1 space-y-1">
                  {blockers.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </NoticeBanner>
            ) : (
              <NoticeBanner>
                Every mandatory input is attested and dual control is satisfied. Acceptance may be
                recorded.
              </NoticeBanner>
            )}

            <PermissionButton
              permission="readiness.accept"
              className="w-full"
              disabled={blockers.length > 0}
              onClick={() => {
                if (!reason.trim()) {
                  toast.error("A reason is required");
                  return;
                }
                if (acceptPacket(packet.id, reason.trim())) {
                  toast.success(`${packet.code} accepted`, {
                    description: "Recorded append-only. Corrections use reversal, never overwrite.",
                  });
                  setReason("");
                } else {
                  toast.error("Acceptance refused", { description: blockers[0] ?? "Gate conditions not met." });
                }
              }}
            >
              Accept packet against gate
            </PermissionButton>

            {acceptanceHistory.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acceptance history (session)
                </p>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {acceptanceHistory.map((h) => (
                    <li key={h.id}>
                      <span className="font-medium text-foreground">{h.packetVersion}</span> accepted
                      by {h.actor} on {h.at}. Reason: {h.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Truth model - mock capability versus production acceptance"
        description="What this mockup demonstrates today, stated without overclaiming."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Mock capability</TableHead>
                <TableHead>Production acceptance</TableHead>
                <TableHead>Where to look</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {truthModel.map((row) => (
                <TableRow key={row.item}>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={row.mock}
                      tone={
                        row.mock === "Implemented"
                          ? "success"
                          : row.mock === "Partial"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.production ?? "Not assessed"}
                  </TableCell>
                  <TableCell>
                    {row.link ? (
                      <Link
                        to={row.link.to}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {row.link.label}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard
        title="Open decisions blocking acceptance"
        description="Each decision names the accountable role, the due date and the packet it blocks."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Accountable role</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Blocks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openDecisions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold">{d.id}</TableCell>
                  <TableCell>{d.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{d.ownerRole}</TableCell>
                  <TableCell className="tnum">{d.due}</TableCell>
                  <TableCell>{d.blockedPacket}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={d.status}
                      tone={d.status === "Resolved" ? "success" : d.status === "In discussion" ? "info" : "warning"}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.nextAction}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}