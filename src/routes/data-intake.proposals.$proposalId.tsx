import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SyntheticIntakeWarning } from "@/components/app/intake";
import { ProposalActivityFeed } from "@/components/app/intake-activity";
import { PageHeader } from "@/components/app/page-header";
import { PermissionButton, RoleAccessNotice } from "@/components/app/permission";
import { EmptyState, KeyValue, SectionCard } from "@/components/app/primitives";
import { RuleResultBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/demo-data/store";

const TITLE = "Registry change proposal - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Owner review of a module-registry change proposal: validation checks, downstream impact and an approve or reject decision with a recorded reason.";

export const Route = createFileRoute("/data-intake/proposals/$proposalId")({
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
  component: ProposalPage,
});

function ProposalPage() {
  const { proposalId } = Route.useParams();
  const { proposals, decideProposal } = useDemoState();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");

  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    return (
      <div>
        <PageHeader
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Data intake", to: "/data-intake" },
            { label: "Proposal" },
          ]}
          title="Proposal not found"
          subtitle="This registry change proposal is not part of the current session."
        />
        <EmptyState
          title="No such proposal"
          description="Return to governed data intake to see the proposals in force."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/data-intake">Back to intake</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pending = proposal.status === "Pending owner approval";

  return (
    <div>
      <PageHeader
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Data intake", to: "/data-intake" },
          { label: proposal.id },
        ]}
        title={`${proposal.changeType}: ${proposal.moduleCode} ${proposal.moduleName}`}
        subtitle="The module registry is governed. A proposal is validated, its downstream impact stated, then approved or rejected by the programme owner with a reason."
        secondary={
          <Button asChild variant="outline" size="sm">
            <Link to="/data-intake">
              <ArrowLeft className="size-4" aria-hidden /> Back to intake
            </Link>
          </Button>
        }
        primary={
          <StatusBadge
            label={proposal.status}
            tone={
              proposal.status === "Approved"
                ? "success"
                : proposal.status === "Rejected"
                  ? "danger"
                  : "warning"
            }
          />
        }
      />

      <div className="space-y-6">
        <SyntheticIntakeWarning />
        <RoleAccessNotice permissions={["registry.approve"]} />

        <SectionCard title="Proposal detail" description="Submitted values and the source reference behind them.">
          <KeyValue
            items={[
              { label: "Proposal ID", value: proposal.id },
              { label: "Change type", value: proposal.changeType },
              { label: "Module code", value: proposal.moduleCode },
              { label: "Module name", value: proposal.moduleName },
              { label: "Estate", value: proposal.estate },
              { label: "Crosswalk", value: proposal.crosswalk },
              { label: "Effective date", value: proposal.effectiveDate },
              { label: "Source reference", value: proposal.sourceRef },
              { label: "Requested by", value: `${proposal.requestedBy} · ${proposal.requestedAt}` },
              { label: "Rationale", value: proposal.rationale },
              { label: "Downstream impact", value: proposal.impact },
              ...(proposal.decidedBy
                ? [
                    {
                      label: "Decision",
                      value: `${proposal.status} by ${proposal.decidedBy} · ${proposal.decidedAt ?? ""}`,
                    },
                    { label: "Decision reason", value: proposal.decisionReason ?? "-" },
                  ]
                : []),
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Validation checks"
          description="Automated checks run when the proposal was submitted. Warnings do not block approval but are recorded."
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Check</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposal.validation.map((v) => (
                  <TableRow key={v.check}>
                    <TableCell className="font-medium text-navy">{v.check}</TableCell>
                    <TableCell>
                      <RuleResultBadge
                        result={v.result === "pass" ? "pass" : v.result === "warning" ? "watch" : "breach"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {pending && (
          <SectionCard
            title="Owner decision"
            description="A reason is required for both approval and rejection. The decision is appended to the audit trail."
          >
            <div className="space-y-1.5">
              <Label htmlFor="decision-reason">
                Decision reason <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="decision-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: approved for the September gate, schedule to be re-issued by the PMO."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PermissionButton
                permission="registry.approve"
                onClick={() => {
                  if (reason.trim().length < 8) {
                    toast.error("Reason required", {
                      description: "Give at least eight characters of justification.",
                    });
                    return;
                  }
                  if (decideProposal(proposal.id, true, reason.trim())) {
                    toast.success("Proposal approved", {
                      description: `${proposal.moduleCode} is now in force for this session.`,
                    });
                    navigate({ to: "/data-intake" });
                  }
                }}
              >
                <Check className="size-4" aria-hidden /> Approve change
              </PermissionButton>
              <PermissionButton
                permission="registry.approve"
                variant="outline"
                onClick={() => {
                  if (reason.trim().length < 8) {
                    toast.error("Reason required", {
                      description: "Give at least eight characters of justification.",
                    });
                    return;
                  }
                  if (decideProposal(proposal.id, false, reason.trim())) {
                    toast.success("Proposal rejected", {
                      description: "The registry is unchanged and the decision is logged.",
                    });
                    navigate({ to: "/data-intake" });
                  }
                }}
              >
                <X className="size-4" aria-hidden /> Reject change
              </PermissionButton>
            </div>
          </SectionCard>
        )}

        <ProposalActivityFeed proposalId={proposal.id} />
      </div>
    </div>
  );
}