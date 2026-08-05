import { Link } from "@tanstack/react-router";
import { Download, Inbox, RefreshCw, TriangleAlert, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-navy">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  trend,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  hint: string;
  trend?: { direction: "up" | "down" | "flat"; text: string };
  onClick?: (() => void) | undefined;
  active?: boolean;
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="tnum mt-2 text-3xl font-semibold text-navy">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        {trend?.direction === "up" && <TrendingUp className="size-3.5" aria-hidden />}
        {trend?.direction === "down" && <TrendingDown className="size-3.5" aria-hidden />}
        <span>{trend?.text ?? hint}</span>
      </div>
    </>
  );

  const shared = cn(
    "rounded-xl border bg-card px-5 py-4 text-left shadow-[var(--shadow-card)] transition-colors",
    active ? "border-primary ring-1 ring-primary/30" : "border-border",
  );

  if (!onClick) {
    return (
      <div className={shared} title={hint}>
        {body}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} title={hint} className={cn(shared, "hover:border-primary/60")}>
      {body}
    </button>
  );
}

export function EmptyState({
  title,
  description,
  action,
  tone = "neutral",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "success";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Inbox
        className={cn("size-6", tone === "success" ? "text-success" : "text-muted-foreground")}
        aria-hidden
      />
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger-surface px-6 py-10 text-center"
    >
      <TriangleAlert className="size-6 text-danger" aria-hidden />
      <p className="text-sm font-semibold text-danger">{title}</p>
      <p className="max-w-md text-sm text-foreground">{description}</p>
      <Button variant="outline" size="sm" className="mt-2 bg-card" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden /> Retry
      </Button>
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CitationChip({ reference, invalid }: { reference: string; invalid?: boolean }) {
  return (
    <span
      className={cn(
        "tnum inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px]",
        invalid
          ? "border-danger/30 bg-danger-surface text-danger"
          : "border-border bg-secondary text-secondary-foreground",
      )}
      title={invalid ? "Citation is not in the demo whitelist" : "Synthetic citation reference"}
    >
      {reference}
    </span>
  );
}

export function DemoDownloadButton({
  filename,
  content,
  label,
  variant = "outline",
}: {
  filename: string;
  content: string;
  label: string;
  variant?: "outline" | "secondary" | "default";
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => {
        const blob = new Blob([`DRAFT - SYNTHETIC DATA\n${content}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Simulated export created", {
          description: `${filename} contains synthetic demo rows only.`,
        });
      }}
    >
      <Download className="size-4" aria-hidden /> {label}
    </Button>
  );
}

export function SegmentedBar({
  segments,
  className,
}: {
  segments: { label: string; value: number; className: string }[];
  className?: string | undefined;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={className}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {segments.map((s) => (
          <span
            key={s.label}
            className={s.className}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-sm", s.className)} aria-hidden />
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="tnum font-semibold text-navy">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function KeyValue({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm break-words text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function NoticeBanner({
  tone = "info",
  children,
  icon,
}: {
  tone?: "info" | "warning";
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
        tone === "info"
          ? "border-info/25 bg-info-surface text-foreground"
          : "border-warning/30 bg-warning-surface text-foreground",
      )}
    >
      {icon ?? <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}