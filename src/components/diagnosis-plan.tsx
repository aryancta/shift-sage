"use client";

import type { DiagnosisStep } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Lightbulb, Wrench } from "lucide-react";
import Link from "next/link";

interface DiagnosisPlanProps {
  steps: DiagnosisStep[];
  workarounds: DiagnosisStep[];
  assetName: string;
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors = {
    high: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${colors[level as keyof typeof colors] ?? colors.medium}`}>
      {level}
    </span>
  );
}

export function DiagnosisPlan({ steps, workarounds, assetName }: DiagnosisPlanProps) {
  return (
    <div className="space-y-6">
      {workarounds.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Lightbulb className="h-5 w-5" />
              Hidden workarounds found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workarounds.map((w) => (
              <div key={w.work_order_id} className="rounded-lg border border-amber-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="workaround">{w.workaround_label ?? "Undocumented fix"}</Badge>
                  <Link
                    href={`/work-orders/${w.work_order_id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sage-700 hover:underline"
                  >
                    {w.wo_number}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p className="text-sm font-medium text-foreground">{w.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">{w.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-sage-600" />
            Ranked repair plan for {assetName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step) => (
            <div
              key={`${step.rank}-${step.work_order_id}`}
              className="card relative rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-600 text-sm font-bold text-white">
                  {step.rank}
                </span>
                <ConfidenceBadge level={step.confidence} />
                {step.is_workaround && <Badge variant="workaround">Workaround</Badge>}
                <Link
                  href={`/work-orders/${step.work_order_id}`}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-sage-700 hover:underline"
                >
                  Cited: {step.wo_number}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <p className="text-sm font-medium">{step.action}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{step.rationale}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
