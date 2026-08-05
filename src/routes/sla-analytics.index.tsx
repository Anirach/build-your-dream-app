// SLA analytics over correction hand-offs. Concept-only: synthetic history plus
// the hand-offs recorded in this session.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/app/page-header";
import {
  DemoDownloadButton,
  MetricCard,
  NoticeBanner,
  SectionCard,
  SegmentedBar,
} from "@/components/app/primitives";
import { StatusBadge } from "@/components/app/status";
import { SlaDrillDownSheet, type SlaDrillDown } from "@/components/app/sla-drilldown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoState } from "@/demo-data/store";
import { mandateTypes, ruleFor } from "@/demo-data/signoff-rules";
import {
  applyConfiguredTargets,
  breachTone,
  byMandateType,
  byReviewerRole,
  byStage,
  dataQuality,
  formatHours,
  liveSlaRecords,
  minReliableSample,
  overallSla,
  sampleQuality,
  slaHistory,
  weeklyTrend,
  type SlaAggregate,
  type SlaRecord,
} from "@/demo-data/sla-analytics";

export const Route = createFileRoute("/sla-analytics/")({
  component: SlaAnalytics,
  head: () => ({
    meta: [
      { title: "SLA Analytics · BDMS Intelligence" },
      {
        name: "description",
        content:
          "Correction turnaround analytics: breach rates, average hand-off time and weekly trends by mandate type and reviewer role.",
      },
      { property: "og:title", content: "SLA Analytics · BDMS Intelligence" },
      {
        property: "og:description",
        content:
          "Breach rates, average turnaround and weekly SLA trends across correction hand-offs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Dimension = "mandate" | "role";

function SlaAnalytics() {
  const { correctionRequests, signOffRules } = useDemoState();
  const [dimension, setDimension] = useState<Dimension>("mandate");
  const [stageFilter, setStageFilter] = useState<"all" | "Sign-off" | "Applied">("all");
  const [drill, setDrill] = useState<SlaDrillDown | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const records = useMemo(() => {
    const all = applyConfiguredTargets(
      [...slaHistory, ...liveSlaRecords(correctionRequests)],
      signOffRules,
    );
    return stageFilter === "all" ? all : all.filter((r) => r.stage === stageFilter);
  }, [correctionRequests, signOffRules, stageFilter]);

  const overall = overallSla(records);
  const stages = byStage(records);
  const groups: SlaAggregate[] =
    dimension === "mandate" ? byMandateType(records) : byReviewerRole(records);
  const trend = weeklyTrend(records);
  const liveCount = records.filter((r) => r.live).length;
  const referenceTarget = Math.round(overall.targetHours * 10) / 10;
  const quality = dataQuality(records, groups);
  const overallSample = quality.overall;
  const thinWeeks = trend.filter((t) => t.count < minReliableSample);

  const scopeNote =
    stageFilter === "all" ? "all stages" : `${stageFilter} stage only`;
  const openDrill = (title: string, description: string, subset: SlaRecord[]) =>
    setDrill({ title, description, records: subset });
  const drillWeek = (week: string) =>
    openDrill(
      `Week ${week.replace("W", "")} hand-offs`,
      `Every correction hand-off measured in ${week} (${scopeNote}).`,
      records.filter((r) => r.week === week),
    );
  const drillGroup = (g: SlaAggregate) =>
    openDrill(
      g.label,
      `Corrections behind this ${dimension === "mandate" ? "mandate type" : "reviewer role"} datapoint (${scopeNote}).`,
      records.filter((r) => (dimension === "mandate" ? r.mandateType === g.key : r.role === g.key)),
    );
  const drillStage = (g: SlaAggregate) =>
    openDrill(
      g.label,
      `Corrections measured at the ${g.key} stage.`,
      records.filter((r) => r.stage === g.key),
    );

  const csv = [
    "dimension,label,hand_offs,breaches,breach_rate_pct,avg_hours,worst_hours",
    ...groups.map((g) =>
      [
        dimension,
        `"${g.label}"`,
        g.count,
        g.breaches,
        g.breachRate.toFixed(1),
        g.avgHours.toFixed(1),
        g.worstHours.toFixed(1),
      ].join(","),
    ),
  ].join("\n");

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Audit and Lineage", to: "/audit" }, { label: "SLA analytics" }]}
        title="SLA analytics"
        subtitle="Turnaround performance for every correction hand-off, measured against the sign-off and apply targets configured for each mandate type."
        primary={
          <DemoDownloadButton
            filename={`sla-analytics-by-${dimension}.csv`}
            content={csv}
            label="Export analytics"
          />
        }
      />

      <NoticeBanner tone="info">
        <p className="font-semibold text-navy">Synthetic measurements</p>
        <p className="mt-0.5 text-muted-foreground">
          Six programme weeks of synthetic hand-offs ({slaHistory.length} records) plus {liveCount}{" "}
          recorded in this session. Configured targets (sign-off / apply):{" "}
          {mandateTypes
            .map((m) => {
              const rule = ruleFor(signOffRules, m);
              return `${m} ${rule.signOffTargetHours}h / ${rule.applyTargetHours}h`;
            })
            .join(" · ")}
          . Edit them under Role Management.
        </p>
      </NoticeBanner>

      <div className="mt-6 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Hand-offs measured"
          value={overall.count}
          hint={`Completed sign-off and apply stages in scope · ${quality.live} live, ${quality.synthetic} synthetic.`}
        />
        <MetricCard
          label="Breach rate"
          value={`${Math.round(overall.breachRate)}%`}
          hint={`Share of hand-offs past target · ±${overallSample.marginPct}pp at ${overallSample.label.replace(" · too few", "").replace(" · indicative", "")}.`}
          trend={{
            direction: overall.breachRate >= 20 ? "up" : "down",
            text: `${overall.breaches} of ${overall.count} past target`,
          }}
        />
        <MetricCard
          label="Average turnaround"
          value={formatHours(overall.avgHours)}
          hint={
            overallSample.tier === "reliable"
              ? "Mean elapsed time per hand-off."
              : `Mean elapsed time per hand-off — ${overallSample.note}`
          }
        />
        <MetricCard
          label="Worst hand-off"
          value={formatHours(overall.worstHours)}
          hint="Slowest single hand-off in scope."
        />
      </div>

      {(quality.smallGroups > 0 || thinWeeks.length > 0 || overallSample.tier !== "reliable") && (
        <NoticeBanner tone="warning" className="mt-4">
          <p className="font-semibold text-navy">Small-sample caution</p>
          <p className="mt-0.5 text-muted-foreground">
            {overallSample.tier !== "reliable" && `${overallSample.note} `}
            {quality.smallGroups > 0 &&
              `${quality.smallGroups} of ${quality.groups} breakdown group${quality.smallGroups === 1 ? "" : "s"} sit below ${minReliableSample} hand-offs. `}
            {thinWeeks.length > 0 &&
              `Thin weeks: ${thinWeeks.map((t) => `${t.week} (n=${t.count})`).join(", ")}. `}
            Hollow dots, hatched bars and amber sample badges mark figures that are indicative
            only.
          </p>
        </NoticeBanner>
      )}

      <SlaDrillDownSheet
        drill={drill}
        requests={correctionRequests}
        nowMs={nowMs}
        onClose={() => setDrill(null)}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <SectionCard
          title="Breach trend by week"
          description="Breach rate and average turnaround per programme week. Click any week to open the corrections behind it."
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                className="cursor-pointer"
                onClick={(state: { activeLabel?: string | number }) => {
                  if (state?.activeLabel) drillWeek(String(state.activeLabel));
                }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  yAxisId="rate"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="hours"
                  orientation="right"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  unit="h"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) =>
                    name === "breachRate" ? [`${value}%`, "Breach rate"] : [`${value}h`, "Avg turnaround"]
                  }
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="breachRate"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  dot={{ r: 3, cursor: "pointer" }}
                  activeDot={{ r: 5, cursor: "pointer" }}
                />
                <Line
                  yAxisId="hours"
                  type="monotone"
                  dataKey="avgHours"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3, cursor: "pointer" }}
                  activeDot={{ r: 5, cursor: "pointer" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-destructive" aria-hidden />
              <dt>Breach rate</dt>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-primary" aria-hidden />
              <dt>Average turnaround</dt>
            </div>
          </dl>
        </SectionCard>

        <SectionCard
          title="Stage mix"
          description="Where the hand-offs sit and how each stage performs against its own target. Click a stage to drill into its corrections."
        >
          <SegmentedBar
            segments={stages.map((s) => ({
              label: s.label,
              value: s.count,
              className: s.key === "Sign-off" ? "bg-primary" : "bg-teal",
            }))}
          />
          <ul className="mt-4 space-y-3">
            {stages.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => drillStage(s)}
                  className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary"
                >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{s.label}</p>
                  <StatusBadge
                    label={`${Math.round(s.breachRate)}% breach`}
                    tone={breachTone(s.breachRate)}
                  />
                </div>
                <p className="tnum mt-1 text-xs text-muted-foreground">
                  Avg {formatHours(s.avgHours)} · avg target {Math.round(s.targetHours * 10) / 10}h · worst{" "}
                  {formatHours(s.worstHours)} · {s.count} hand-offs
                </p>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        className="mt-6"
        title="Breakdown"
        description="Compare turnaround and breach rate across mandate types or the reviewer roles that handled each hand-off. Click a bar or a row to see the exact corrections and stage timelines."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={stageFilter} onValueChange={(v) => setStageFilter(v as typeof stageFilter)}>
              <TabsList>
                <TabsTrigger value="all">All stages</TabsTrigger>
                <TabsTrigger value="Sign-off">Sign-off</TabsTrigger>
                <TabsTrigger value="Applied">Apply</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
              <TabsList>
                <TabsTrigger value="mandate">By mandate type</TabsTrigger>
                <TabsTrigger value="role">By reviewer role</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={groups}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              className="cursor-pointer"
              onClick={(state: { activeLabel?: string | number }) => {
                const g = groups.find((x) => x.label === String(state?.activeLabel));
                if (g) drillGroup(g);
              }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={11}
                interval={0}
                tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="h" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${Math.round(value * 10) / 10}h`, "Avg turnaround"]}
              />
              <ReferenceLine
                y={referenceTarget}
                stroke="var(--destructive)"
                strokeDasharray="4 3"
                label={{ value: `${referenceTarget}h avg target`, position: "right", fontSize: 11 }}
              />
              <Bar dataKey="avgHours" radius={[4, 4, 0, 0]} cursor="pointer">
                {groups.map((g) => (
                  <Cell
                    key={g.key}
                    fill={
                      breachTone(g.breachRate) === "danger"
                        ? "var(--destructive)"
                        : breachTone(g.breachRate) === "warning"
                          ? "var(--warning)"
                          : "var(--primary)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">
                  {dimension === "mandate" ? "Mandate type" : "Reviewer role"}
                </th>
                <th className="py-2 pr-4 font-medium">Hand-offs</th>
                <th className="py-2 pr-4 font-medium">Avg turnaround</th>
                <th className="py-2 pr-4 font-medium">Worst</th>
                <th className="py-2 pr-4 font-medium">Breaches</th>
                <th className="py-2 font-medium">Breach rate</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr
                  key={g.key}
                  tabIndex={0}
                  role="button"
                  onClick={() => drillGroup(g)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      drillGroup(g);
                    }
                  }}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary"
                >
                  <td className="py-2.5 pr-4 font-medium text-navy underline decoration-dotted decoration-primary/40 underline-offset-4">
                    {g.label}
                  </td>
                  <td className="tnum py-2.5 pr-4">{g.count}</td>
                  <td className="tnum py-2.5 pr-4">{formatHours(g.avgHours)}</td>
                  <td className="tnum py-2.5 pr-4">{formatHours(g.worstHours)}</td>
                  <td className="tnum py-2.5 pr-4">
                    {g.breaches} / {g.count}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge
                      label={`${Math.round(g.breachRate)}%`}
                      tone={breachTone(g.breachRate)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
