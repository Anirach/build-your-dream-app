import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/app/page-header";
import { RoleAccessNotice } from "@/components/app/permission";
import { ReadinessEvidence } from "@/components/app/readiness-evidence";
import { ReadinessKnowledge } from "@/components/app/readiness-knowledge";
import { ReadinessPackages } from "@/components/app/readiness-packages";
import { ReadinessRoadmap } from "@/components/app/readiness-roadmap";
import { StatusBadge } from "@/components/app/status";
import { cn } from "@/lib/utils";

const TITLE = "Production Readiness Center - BDMS Intelligence Mockup";
const DESCRIPTION =
  "Separate what the mockup demonstrates from what a production owner has accepted: sprint gates, an input and evidence register, knowledge quality gates and governed review packages.";

const tabs = [
  { id: "roadmap", label: "Roadmap and gates" },
  { id: "evidence", label: "Input and evidence register" },
  { id: "knowledge", label: "Knowledge QA" },
  { id: "packages", label: "Review packages" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export const Route = createFileRoute("/delivery-readiness/")({
  validateSearch: z.object({
    tab: z.enum(["roadmap", "evidence", "knowledge", "packages"]).default("roadmap"),
  }),
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

function Page() {
  const { tab } = Route.useSearch();
  const active: TabId = tab;

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Home", to: "/" }, { label: "Production Readiness" }]}
        title="Production Readiness Center"
        subtitle="Mock capability and production acceptance are tracked separately. Sprint gates only open when the named owner attests the mandatory inputs and an independent actor accepts them."
        secondary={
          <StatusBadge
            label="Concept mockup - synthetic data"
            tone="warning"
            icon={<ShieldCheck className="size-3.5" aria-hidden />}
          />
        }
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.id}
            to="/delivery-readiness"
            search={{ tab: t.id }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <RoleAccessNotice permissions={["readiness.update", "readiness.accept", "review.package"]} />
      </div>

      {active === "roadmap" && <ReadinessRoadmap />}
      {active === "evidence" && <ReadinessEvidence />}
      {active === "knowledge" && <ReadinessKnowledge />}
      {active === "packages" && <ReadinessPackages />}
    </div>
  );
}