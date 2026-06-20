"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkOrder } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { ArrowLeft, Loader2, User, Wrench } from "lucide-react";

export default function WorkOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/work-orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => setWorkOrder(d.workOrder))
      .catch(() => setError("Work order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/diagnose">
            <ArrowLeft className="h-4 w-4" />
            Back to diagnose
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/diagnose">
          <ArrowLeft className="h-4 w-4" />
          Back to diagnose
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-mono">{workOrder.wo_number}</CardTitle>
            <Badge variant="secondary">{workOrder.type}</Badge>
            <Badge variant="secondary">{workOrder.status}</Badge>
            {workOrder.is_workaround === 1 && (
              <Badge variant="workaround">Undocumented workaround</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span>{workOrder.asset_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{workOrder.technician_name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {formatDate(workOrder.date)}
            </div>
            <div className="text-sm text-muted-foreground">
              Downtime: {formatDuration(workOrder.downtime_minutes)}
            </div>
          </div>

          {workOrder.fault_code && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Fault code</p>
              <p className="font-mono text-sm">{workOrder.fault_code}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Description</p>
            <p className="mt-1 text-sm">{workOrder.description}</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-medium uppercase text-amber-800">Technician notes</p>
            <p className="mt-2 text-sm text-amber-950">{workOrder.technician_notes}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Resolution</p>
            <p className="mt-1 text-sm">{workOrder.resolution}</p>
          </div>

          {workOrder.workaround_label && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Workaround label
              </p>
              <p className="mt-1 text-sm font-medium text-amber-900">
                {workOrder.workaround_label}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
