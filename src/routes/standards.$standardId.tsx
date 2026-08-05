import { createFileRoute, notFound } from "@tanstack/react-router";

import { PageHeader } from "@/components/app/page-header";
import { KeyValue, NoticeBanner, SectionCard } from "@/components/app/primitives";
import { standardById, SYNTHETIC_LABEL } from "@/demo-data/standards";
import type { StandardRecord } from "@/demo-data/types";

export const Route = createFileRoute("/standards/$standardId")({
  loader: ({ params }): { standard: StandardRecord } => {
    const standard = standardById(params.standardId);
    if (!standard) throw notFound();
    return { standard };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.standard.id} ${loaderData.standard.title} - BDMS Intelligence` },
          { name: "description", content: loaderData.standard.paraphrase },
          { property: "og:title", content: `${loaderData.standard.id} - BDMS Intelligence` },
          { property: "og:description", content: loaderData.standard.paraphrase },
        ]
      : [{ title: "Standard not found" }, { name: "robots", content: "noindex" }],
  }),
  component: StandardDetail,
});

function StandardDetail() {
  const { standard } = Route.useLoaderData();
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "SHSIRC - Dhaka", to: "/" },
          { label: "Standards Library", to: "/standards" },
          { label: standard.id },
        ]}
        title={`${standard.id} - ${standard.title}`}
        subtitle={standard.paraphrase}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Measurable elements">
          <ul className="space-y-2 text-sm">
            {standard.measurableElements.map((me: { id: string; text: string }) => (
              <li key={me.id} className="rounded-lg border border-border px-3 py-2">
                <span className="tnum font-semibold text-navy">{me.id}</span> {me.text}
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Record details">
          <KeyValue
            items={[
              { label: "Chapter", value: standard.chapter },
              { label: "Classification", value: standard.classification },
              { label: "Language", value: standard.language },
              { label: "Crosswalk", value: standard.crosswalk ? "Yes" : "No" },
              { label: "Related modules", value: standard.relatedModules.join(", ") || "None" },
            ]}
          />
        </SectionCard>
      </div>
      <NoticeBanner tone="warning">{SYNTHETIC_LABEL}. {standard.matchReasons.join("; ")}</NoticeBanner>
    </>
  );
}
