import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  FileWarning,
  Info,
  OctagonAlert,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Rag } from "@/demo-data/types";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClass: Record<Tone, string> = {
  success: "bg-success-surface text-success border-success/25",
  warning: "bg-warning-surface text-warning border-warning/30",
  danger: "bg-danger-surface text-danger border-danger/25",
  info: "bg-info-surface text-info border-info/25",
  neutral: "bg-secondary text-muted-foreground border-border",
};

const toneIcon: Record<Tone, ReactNode> = {
  success: <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />,
  warning: <AlertTriangle className="size-3.5 shrink-0" aria-hidden />,
  danger: <OctagonAlert className="size-3.5 shrink-0" aria-hidden />,
  info: <Info className="size-3.5 shrink-0" aria-hidden />,
  neutral: <CircleDashed className="size-3.5 shrink-0" aria-hidden />,
};

export function StatusBadge({
  label,
  tone = "neutral",
  title,
  className,
  icon,
}: {
  label: string;
  tone?: Tone;
  title?: string | undefined;
  className?: string | undefined;
  icon?: ReactNode;
}) {
  return (
    <span
      title={title ?? label}
      tabIndex={0}
      aria-label={title ? `${label}. ${title}` : label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {icon ?? toneIcon[tone]}
      {label}
    </span>
  );
}

export const ragTone: Record<Rag, Tone> = { green: "success", amber: "warning", red: "danger" };
export const ragLabel: Record<Rag, string> = { green: "GREEN", amber: "AMBER", red: "RED" };

export function RagBadge({ rag, className }: { rag: Rag; className?: string }) {
  return (
    <StatusBadge
      label={ragLabel[rag]}
      tone={ragTone[rag]}
      className={className}
      title={
        rag === "green"
          ? "Rule-calculated: no breached thresholds"
          : rag === "amber"
            ? "Rule-calculated: at least one watch threshold breached"
            : "Rule-calculated: at least one red threshold breached"
      }
    />
  );
}

export function stateTone(state: string): Tone {
  switch (state) {
    case "Present":
    case "Approved":
    case "Complete":
    case "On track":
    case "Valid":
    case "High":
      return "success";
    case "Partial":
    case "Present - unverified":
    case "In progress":
    case "Watch":
    case "At risk":
    case "Submitted":
    case "Medium":
    case "Returned for correction":
    case "Returned":
    case "Awaiting review":
      return "warning";
    case "Missing":
    case "Absent":
    case "Overdue":
    case "Blocked":
    case "Critical":
    case "Invalid":
    case "Auto-rejected":
    case "Rejected":
      return "danger";
    case "Draft":
    case "DRAFT":
      return "info";
    default:
      return "neutral";
  }
}

export function StateBadge({ state, title }: { state: string; title?: string }) {
  return <StatusBadge label={state} tone={stateTone(state)} title={title} />;
}

export function DraftBadge({ label = "DRAFT" }: { label?: string }) {
  return (
    <StatusBadge
      label={label}
      tone="info"
      icon={<FileWarning className="size-3.5 shrink-0" aria-hidden />}
      title="Draft content. AI drafts cannot approve, publish or change programme status."
    />
  );
}

export function ApprovedBadge({ by, at }: { by: string; at: string }) {
  return (
    <StatusBadge label={`Approved - ${by}, ${at}`} tone="success" title="Human approval recorded" />
  );
}

export function RejectedBadge({ reason }: { reason: string }) {
  return (
    <StatusBadge
      label="Rejected"
      tone="danger"
      title={reason}
      icon={<XCircle className="size-3.5 shrink-0" aria-hidden />}
    />
  );
}

export function ConfidenceIndicator({ value }: { value: number }) {
  const band = value >= 0.85 ? "High" : value >= 0.65 ? "Medium" : "Low";
  const tone: Tone = band === "High" ? "success" : band === "Medium" ? "warning" : "danger";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="tnum text-xs font-semibold">
        {band} {value.toFixed(2)}
      </span>
    </span>
  );
}