import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/app/page-header";
import {
  DemoDownloadButton,
  EmptyState,
  MetricCard,
  NoticeBanner,
  SectionCard,
} from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHAPTERS,
  QUICK_SEARCHES,
  searchStandards,
  standards,
  STANDARDS_NOTICE,
  SYNTHETIC_LABEL,
} from "@/demo-data/standards";

const TITLE = "Standards Library - BDMS Intelligence";
const DESCRIPTION =
  "Search synthetic JCI and local-overlay standards, then open a standard for its measurable elements.";

export const Route = createFileRoute("/standards/")({
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
  component: StandardsLibrary,
});

function StandardsLibrary() {
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("all");
  const [classification, setClassification] = useState("all");

  const results = useMemo(() => {
    return searchStandards(query).filter(
      (s) =>
        (chapter === "all" || s.chapter === chapter) &&
        (classification === "all" || s.classification === classification),
    );
  }, [query, chapter, classification]);

  const crosswalked = results.filter((s) => s.crosswalk).length;
  const filtersActive = query !== "" || chapter !== "all" || classification !== "all";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "Standards Library" }]}
        title="Standards Library"
        subtitle="Explore the synthetic standards corpus used across the commissioning mockup."
        actions={
          <DemoDownloadButton
            filename="standards-library-demo.csv"
            label="Export results"
            content={[
              "id,chapter,title,classification,crosswalk",
              ...results.map((s) =>
                [s.id, s.chapter, s.title, s.classification, s.crosswalk ? "Yes" : "No"]
                  .map((v) => `"${v}"`)
                  .join(","),
              ),
            ].join("\n")}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Standards in corpus" value={standards.length} hint="Synthetic records" />
        <MetricCard label="Matching results" value={results.length} hint="Current filters" />
        <MetricCard label="Crosswalked" value={crosswalked} hint="Mapped to local overlay" />
      </div>

      <SectionCard
        title="Search standards"
        description="Matches on identifier, title, paraphrase, chapter and keywords."
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search standards, e.g. hand hygiene"
                className="pl-9"
                aria-label="Search standards"
              />
            </div>
            <Select value={chapter} onValueChange={setChapter}>
              <SelectTrigger aria-label="Filter by chapter">
                <SelectValue placeholder="All chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chapters</SelectItem>
                {CHAPTERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger aria-label="Filter by classification">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Measurable element">Measurable element</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Quick searches</span>
            {QUICK_SEARCHES.map((q) => (
              <Button key={q} size="sm" variant="outline" onClick={() => setQuery(q)}>
                {q}
              </Button>
            ))}
            {filtersActive ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setChapter("all");
                  setClassification("all");
                }}
              >
                <X className="size-4" /> Clear
              </Button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={`Results (${results.length})`} bodyClassName="p-0">
        {results.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No standards match this search"
              description="Try a broader keyword or clear the chapter and type filters."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {results.map((standard) => (
              <li key={standard.id}>
                <Link
                  to="/standards/$standardId"
                  params={{ standardId: standard.id }}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/60 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tnum text-sm font-semibold text-navy">{standard.id}</span>
                      <Badge variant="outline">{standard.classification}</Badge>
                      {standard.crosswalk ? <Badge variant="secondary">Crosswalk</Badge> : null}
                    </div>
                    <p className="text-sm font-medium">{standard.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {standard.paraphrase}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {standard.chapter}
                      {standard.relatedModules.length
                        ? ` - Modules ${standard.relatedModules.join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                    Open standard <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <NoticeBanner tone="warning">
        {SYNTHETIC_LABEL}. {STANDARDS_NOTICE}
      </NoticeBanner>
    </>
  );
}
