"use client";

import type { HandoverDraft, WorkOrderDraft } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OutputDraftsProps {
  workOrder: WorkOrderDraft | null;
  handover: HandoverDraft | null;
  loading?: boolean;
}

export function OutputDrafts({ workOrder, handover, loading }: OutputDraftsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
          Generating work order and handover...
        </CardContent>
      </Card>
    );
  }

  if (!workOrder && !handover) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Closing the loop</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workorder">
          <TabsList>
            <TabsTrigger value="workorder" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Work order
            </TabsTrigger>
            <TabsTrigger value="handover" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              Shift handover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workorder" className="mt-4 space-y-3">
            {workOrder && (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">WO Number:</span>{" "}
                    <span className="font-mono font-medium">{workOrder.wo_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>{" "}
                    <span className="font-medium text-red-700">{workOrder.priority}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Asset:</span>{" "}
                    <span className="font-medium">{workOrder.asset_name}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">{workOrder.fault_summary}</p>
                  <p className="mt-2 text-muted-foreground">{workOrder.cleaned_description}</p>
                  {workOrder.recommended_actions.length > 0 && (
                    <ul className="mt-3 list-inside list-disc space-y-1">
                      {workOrder.recommended_actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Est. downtime: {workOrder.estimated_downtime}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyText("wo", JSON.stringify(workOrder, null, 2))
                  }
                >
                  {copied === "wo" ? "Copied!" : "Copy work order"}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="handover" className="mt-4 space-y-3">
            {handover && (
              <>
                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-3">
                  <p>{handover.shift_summary}</p>
                  {handover.open_issues.length > 0 && (
                    <div>
                      <p className="font-medium text-amber-800">Open issues</p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {handover.open_issues.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {handover.watch_items.length > 0 && (
                    <div>
                      <p className="font-medium">Watch items</p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {handover.watch_items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="font-medium text-sage-800">
                    Next shift: {handover.next_shift_priority}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyText("ho", JSON.stringify(handover, null, 2))
                  }
                >
                  {copied === "ho" ? "Copied!" : "Copy handover note"}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
