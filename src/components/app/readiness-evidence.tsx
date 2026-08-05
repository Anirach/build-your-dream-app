// Tab B: Input and evidence register. Concept-only; no real artifacts are stored.
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PermissionButton } from "@/components/app/permission";
import { KeyValue, MetricCard, NoticeBanner, SectionCard } from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  documentLevels,
  evidenceStates,
  evidenceStateTone,
  isGateReady,
  type EvidenceState,
} from "@/demo-data/evidence-register";
import { readinessPackets } from "@/demo-data/readiness";
import { useDemoState } from "@/demo-data/store";

export function ReadinessEvidence() {
  const { evidenceRegister, updateEvidenceState } = useDemoState();
  const [packetFilter, setPacketFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<EvidenceState>("Received - unverified");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");

  const rows = useMemo(
    () =>
      evidenceRegister.filter(
        (a) =>
          (packetFilter === "all" || a.requiredBy === packetFilter) &&
          (stateFilter === "all" || a.state === stateFilter) &&
          (levelFilter === "all" || a.level === levelFilter),
      ),
    [evidenceRegister, packetFilter, stateFilter, levelFilter],
  );

  const artifact = evidenceRegister.find((a) => a.id === openId) ?? null;
  const readyCount = evidenceRegister.filter((a) => isGateReady(a.state)).length;
  const missing = evidenceRegister.filter((a) => a.state === "Missing").length;
  const correction = evidenceRegister.filter((a) => a.state === "Needs correction").length;

  function openArtifact(id: string) {
    const found = evidenceRegister.find((a) => a.id === id);
    if (!found) return;
    setOpenId(id);
    setDraftState(found.state);
    setNote(found.note);
    setReference(found.reference);
  }

  return (
    <div className="space-y-6">
      <NoticeBanner>
        The register tracks references only. No document is uploaded or stored in this mockup, and
        no reference implies the underlying artifact has been verified.
      </NoticeBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Artifacts tracked"
          value={evidenceRegister.length}
          hint="Mandatory inputs across Sprint 0 to Sprint 4"
        />
        <MetricCard
          label="Ready or accepted"
          value={readyCount}
          hint="Counts towards an acceptance gate"
        />
        <MetricCard label="Missing" value={missing} hint="No reference recorded yet" />
        <MetricCard label="Needs correction" value={correction} hint="Returned to the owner" />
      </div>

      <SectionCard
        title="Input and evidence register"
        description="Filter by packet, state or document level. Open a row to record a reference and attest readiness."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={packetFilter} onValueChange={setPacketFilter}>
              <SelectTrigger className="h-9 w-[190px]">
                <SelectValue placeholder="Packet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All packets</SelectItem>
                {readinessPackets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-9 w-[190px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {evidenceStates.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {documentLevels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        bodyClassName="px-0 py-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Artifact</TableHead>
                <TableHead>Required by</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.id}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <span className="block font-medium text-navy">{a.title}</span>
                    <span className="block text-xs text-muted-foreground">{a.classification}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.requiredBy}</TableCell>
                  <TableCell className="text-muted-foreground">{a.owner}</TableCell>
                  <TableCell>
                    <StatusBadge label={a.level} tone="neutral" title={`Parent: ${a.parentRef}`} />
                  </TableCell>
                  <TableCell className="tnum text-xs text-muted-foreground">{a.version}</TableCell>
                  <TableCell>
                    <StatusBadge label={a.state} tone={evidenceStateTone(a.state)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PermissionButton
                      permission="readiness.update"
                      variant="outline"
                      size="sm"
                      onClick={() => openArtifact(a.id)}
                    >
                      Record
                    </PermissionButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No artifacts match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Sheet open={artifact !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {artifact && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {artifact.id} · {artifact.title}
                </SheetTitle>
                <SheetDescription>
                  Record a reference and state. Attesting readiness names you as the attesting actor.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6">
                <KeyValue
                  items={[
                    { label: "Required by", value: artifact.requiredBy },
                    { label: "Owner", value: `${artifact.owner} (${artifact.ownerRole})` },
                    { label: "Classification", value: artifact.classification },
                    { label: "Version", value: artifact.version },
                    { label: "Checksum", value: artifact.checksum },
                    { label: "Document level", value: `${artifact.level} · parent ${artifact.parentRef}` },
                    { label: "Modules", value: artifact.modules.join(", ") || "Not scoped" },
                    { label: "Attested by", value: `${artifact.attestedBy} (${artifact.attestedAt})` },
                  ]}
                />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Required checks before this counts as evidence
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {artifact.requiredChecks.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">State</label>
                  <Select value={draftState} onValueChange={(v) => setDraftState(v as EvidenceState)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ev-ref" className="text-xs font-medium text-muted-foreground">
                    Reference (path, ticket or document ID)
                  </label>
                  <input
                    id="ev-ref"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ev-note" className="text-xs font-medium text-muted-foreground">
                    Reason or note (mandatory)
                  </label>
                  <textarea
                    id="ev-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <PermissionButton
                  permission="readiness.update"
                  className="w-full"
                  onClick={() => {
                    if (!note.trim()) {
                      toast.error("A reason is required");
                      return;
                    }
                    if (updateEvidenceState(artifact.id, draftState, note.trim(), reference.trim())) {
                      toast.success(`${artifact.id} updated`, {
                        description: `State recorded as ${draftState} and appended to the audit trail.`,
                      });
                      setOpenId(null);
                    }
                  }}
                >
                  Save state and reason
                </PermissionButton>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}