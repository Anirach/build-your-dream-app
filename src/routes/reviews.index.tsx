import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import {
  DemoDownloadButton,
  EmptyState,
  MetricCard,
  NoticeBanner,
  SectionCard,
} from "@/components/app/primitives";
import { StateBadge, StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviewQueue, reviewers } from "@/demo-data/reviews";
import { useDemoState } from "@/demo-data/store";
import { RoleAccessNotice } from "@/components/app/permission";
import type { ReviewQueueItem } from "@/demo-data/types";

const TITLE = "Review queue - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Synthetic human review queue for AI drafts: awaiting review, returned for correction, auto-rejected and approved items.";

export const Route = createFileRoute("/reviews/")({
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

type FilterKey = "all" | "awaiting" | "returned" | "rejected" | "approved";

const FILTERS: { key: FilterKey; label: string; match: (s: ReviewQueueItem["status"]) => boolean }[] =
  [
    { key: "all", label: "All items", match: () => true },
    { key: "awaiting", label: "Awaiting review", match: (s) => s === "Awaiting review" },
    { key: "returned", label: "Returned", match: (s) => s === "Returned for correction" },
    { key: "rejected", label: "Auto-rejected", match: (s) => s === "Auto-rejected" },
    { key: "approved", label: "Approved", match: (s) => s === "Approved" },
  ];

function Page() {
  const { reviewStatuses, reassign } = useDemoState();
  const { can, denialReason } = useDemoState();
  const [filter, setFilter] = useState<FilterKey>("awaiting");
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      reviewQueue.map((item) => ({
        ...item,
        status: reviewStatuses[item.id] ?? item.status,
      })),
    [reviewStatuses],
  );

  const counts = useMemo(
    () => ({
      awaiting: items.filter((i) => i.status === "Awaiting review").length,
      returned: items.filter((i) => i.status === "Returned for correction").length,
      rejected: items.filter((i) => i.status === "Auto-rejected").length,
      approved: items.filter((i) => i.status === "Approved").length,
      overdue: items.filter((i) => i.overdue && i.status === "Awaiting review").length,
    }),
    [items],
  );

  const active = FILTERS.find((f) => f.key === filter)!;
  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      active.match(i.status) &&
      (q === "" ||
        i.item.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.moduleCode.toLowerCase().includes(q)),
  );

  const csv = [
    "id,item,module,type,submitted,due,status,citation",
    ...visible.map((i) =>
      [i.id, `"${i.item}"`, i.moduleCode, `"${i.draftType}"`, i.submitted, i.due, i.status, i.citation].join(","),
    ),
  ].join("\n");

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Review queue" }]}
        title="Review queue"
        subtitle="Every AI draft waits here for a named human decision. Drafts cannot change programme status until a reviewer approves them."
        primary={
          <Button asChild size="sm">
            <Link to="/workbench">
              Open AI Workbench <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
        secondary={
          <DemoDownloadButton
            filename="synthetic-review-queue.csv"
            content={csv}
            label="Export queue"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Awaiting review"
          value={counts.awaiting}
          hint="Synthetic drafts requiring a human decision"
          onClick={() => setFilter("awaiting")}
          active={filter === "awaiting"}
        />
        <MetricCard
          label="Overdue"
          value={counts.overdue}
          hint="Awaiting items past their synthetic due date"
          trend={{ direction: counts.overdue > 0 ? "up" : "flat", text: `${counts.overdue} past due date` }}
        />
        <MetricCard
          label="Returned for correction"
          value={counts.returned}
          hint="Drafts sent back to the agent with a recorded reason"
          onClick={() => setFilter("returned")}
          active={filter === "returned"}
        />
        <MetricCard
          label="Approved (demo)"
          value={counts.approved}
          hint="Human-approved items in this mock session"
          onClick={() => setFilter("approved")}
          active={filter === "approved"}
        />
      </div>

      <div className="mt-6 space-y-6">
        <SectionCard
          title="Queue"
          description="Filter the synthetic queue, then open an item to review clause-level detail."
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search item, ID or module"
              className="h-9 w-full sm:w-64"
              aria-label="Search review queue"
            />
          }
          bodyClassName="px-0 py-0"
        >
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                type="button"
                size="sm"
                variant={filter === f.key ? "default" : "outline"}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="tnum ml-1 opacity-70">
                  {f.key === "all" ? items.length : items.filter((i) => f.match(i.status)).length}
                </span>
              </Button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No matching review items"
                description="No synthetic items match this filter and search. Clear the search or pick another filter."
                action={
                  <Button variant="outline" size="sm" onClick={() => { setFilter("all"); setQuery(""); }}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum font-mono text-xs text-muted-foreground">{item.id}</span>
                        <StateBadge state={item.status} />
                        {item.overdue && item.status === "Awaiting review" && (
                          <StatusBadge
                            label="Overdue"
                            tone="danger"
                            title={`Due ${item.due} (synthetic)`}
                            icon={<AlertTriangle className="size-3.5 shrink-0" aria-hidden />}
                          />
                        )}
                        {item.stale && (
                          <StatusBadge
                            label="Source changed"
                            tone="warning"
                            title="The source document changed after this draft was generated. Re-run recommended."
                          />
                        )}
                        {item.citation === "Invalid" && (
                          <StatusBadge label="Citation invalid" tone="danger" title="Citation validation failed" />
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-navy">{item.item}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.draftType} · Module{" "}
                        <Link
                          to="/programme"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {item.moduleCode}
                        </Link>{" "}
                        · Submitted by {item.submittedBy} on {item.submitted}
                      </p>
                      <p className="tnum mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden /> Due {item.due} · Estimated effort{" "}
                        {item.effort}
                      </p>
                      {item.reason && (
                        <p className="mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs text-foreground">
                          <span className="font-semibold">Reason recorded: </span>
                          {item.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-56">
                      <Button asChild size="sm" disabled={item.status === "Auto-rejected"}>
                        <Link to="/workbench">
                          {item.status === "Awaiting review" ? "Review draft" : "Open draft"}
                        </Link>
                      </Button>
                      <Select
                        disabled={!can("review.reassign")}
                        onValueChange={(value) => {
                          if (reassign(item.id, value)) {
                            toast.success("Simulated reassignment recorded", {
                              description: `${item.id} reassigned to ${value} in the session audit trail.`,
                            });
                          }
                        }}
                      >
                        <SelectTrigger
                          className="h-9"
                          aria-label={`Reassign ${item.id}`}
                          title={can("review.reassign") ? undefined : denialReason("review.reassign")}
                        >
                          <SelectValue
                            placeholder={
                              can("review.reassign") ? "Reassign reviewer" : "Reassignment restricted"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewers.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <NoticeBanner tone="warning">
          Synthetic queue for concept demonstration. Reviewer names are fictional, and no decision
          here carries clinical or contractual authority.
        </NoticeBanner>
      </div>
    </>
  );
}
