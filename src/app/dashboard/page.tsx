"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ManagerStats } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
  UserX,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = () => {
    setLoading(true);
    setError(null);
    fetch("/api/manager/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => setStats(data))
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-destructive">{error ?? "Unknown error"}</p>
        <Button onClick={loadStats} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">Operations dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Recurring failures and knowledge concentration risk across the plant.
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage-100">
              <Wrench className="h-6 w-6 text-sage-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_work_orders}</p>
              <p className="text-sm text-muted-foreground">Work orders indexed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_workarounds}</p>
              <p className="text-sm text-muted-foreground">Undocumented workarounds</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <BarChart3 className="h-6 w-6 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.assets_down}</p>
              <p className="text-sm text-muted-foreground">Assets currently down</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sage-600" />
              Recurring failures by asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recurring_failures.map((f) => (
                <div
                  key={f.asset_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{f.asset_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last: {formatDate(f.last_failure)} | Top code: {f.top_fault ?? "N/A"}
                    </p>
                  </div>
                  <Badge variant="secondary">{f.failure_count} incidents</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Knowledge retirement risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.knowledge_risks.map((r) => (
                <div
                  key={r.technician_id}
                  className={`rounded-lg border p-4 ${
                    r.retirement_risk >= 80 ? "border-red-200 bg-red-50/50" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{r.technician_name}</p>
                    {r.retirement_risk >= 80 && (
                      <Badge variant="risk">Retirement risk {r.retirement_risk}%</Badge>
                    )}
                    <Badge variant="secondary" className="ml-auto">
                      {r.exclusive_fixes} exclusive fixes
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Critical assets: {r.critical_assets.join(", ")}
                  </p>
                  <p className="mt-2 text-sm italic text-amber-900">
                    &ldquo;{r.sample_workaround}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild className="bg-sage-600 hover:bg-sage-700">
          <Link href="/diagnose">Run a diagnosis</Link>
        </Button>
      </div>
    </div>
  );
}
