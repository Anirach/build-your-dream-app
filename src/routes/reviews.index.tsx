import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/app/page-header";
import { NoticeBanner, SectionCard } from "@/components/app/primitives";

export const Route = createFileRoute("/reviews/")({
  head: () => ({
    meta: [
      { title: "reviews - BDMS Intelligence Mockup" },
      { name: "description", content: "Synthetic reviews workspace in the BDMS Intelligence commissioning governance mockup." },
      { property: "og:title", content: "reviews - BDMS Intelligence Mockup" },
      { property: "og:description", content: "Synthetic reviews workspace in the BDMS Intelligence commissioning governance mockup." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "SHSIRC - Dhaka", to: "/" }, { label: "reviews" }]}
        title="reviews"
        subtitle="This workspace is part of the BDMS Intelligence concept mockup and uses synthetic records only."
      />
      <SectionCard title="Coming next in this mockup">
        <p className="text-sm text-muted-foreground">
          The reviews workspace is being assembled from the synthetic demo dataset already loaded in
          this mockup.
        </p>
      </SectionCard>
      <NoticeBanner tone="warning">
        Synthetic placeholder content. Nothing here is authoritative or clinical guidance.
      </NoticeBanner>
    </>
  );
}
