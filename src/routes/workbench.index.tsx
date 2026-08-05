import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CheckCircle2, Pencil, Play, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/page-header";
import {
  CitationChip,
  DemoDownloadButton,
  EmptyState,
  KeyValue,
  MetricCard,
  NoticeBanner,
  SectionCard,
  SegmentedBar,
} from "@/components/app/primitives";
import { ConfidenceIndicator, DraftBadge, StateBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  confidenceBand,
  demoModel,
  mappingRows,
  mappingRun,
  recentRuns,
  sampleSops,
} from "@/demo-data/mapping";
import { standards } from "@/demo-data/standards";
import { useDemoState } from "@/demo-data/store";
import type { MappingRowView } from "@/demo-data/types";

const TITLE = "AI Workbench - BDMS Intelligence";
const DESCRIPTION =
  "Simulate an SOP-to-standards mapping run, review every clause and record human decisions.";

export const Route = createFileRoute("/workbench/")({
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
  component: WorkbenchPage;
});
