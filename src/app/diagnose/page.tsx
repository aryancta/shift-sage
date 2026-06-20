"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpeechRecognitionLike } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasoningTrace } from "@/components/reasoning-trace";
import { DiagnosisPlan } from "@/components/diagnosis-plan";
import { OutputDrafts } from "@/components/output-drafts";
import { StatusBadge } from "@/components/status-badge";
import { buildApiHeaders } from "@/lib/api-keys";
import { DEMO_FAULT } from "@/lib/seed-data";
import type { Asset, DiagnosisResult, HandoverDraft, WorkOrderDraft } from "@/lib/types";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Mic,
  Play,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function DiagnosePage() {
  const [fault, setFault] = useState("");
  const [email, setEmail] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [traceSteps, setTraceSteps] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrderDraft | null>(null);
  const [handover, setHandover] = useState<HandoverDraft | null>(null);
  const [generatingOutputs, setGeneratingOutputs] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => {});
  }, []);

  const loadDemoFault = () => setFault(DEMO_FAULT);

  const startVoiceCapture = () => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError("Voice capture is not supported in this browser. Type your fault instead.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    setListening(true);
    setError(null);

    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setFault((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };

    recognition.onerror = () => {
      setError("Voice capture failed. Check microphone permissions.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const runDiagnosis = useCallback(async () => {
    if (fault.trim().length < 5) {
      setError("Describe the fault in at least a few words.");
      return;
    }

    setError(null);
    setIsDiagnosing(true);
    setIsStreaming(true);
    setDiagnosis(null);
    setTraceSteps([]);
    setWorkOrder(null);
    setHandover(null);

    try {
      const res = await fetch("/api/diagnose/stream", {
        method: "POST",
        headers: buildApiHeaders(),
        body: JSON.stringify({ fault: fault.trim(), email }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7);
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (!data) continue;
          const parsed = JSON.parse(data);

          if (event === "trace") {
            setTraceSteps((prev) => [...prev, parsed.step]);
          } else if (event === "result") {
            setDiagnosis(parsed as DiagnosisResult);
            setIsStreaming(false);
          } else if (event === "error") {
            throw new Error(parsed.message);
          }
        }
      }
    } catch {
      setError("Diagnosis failed. Demo mode may still apply on retry.");
      try {
        const fallback = await fetch("/api/diagnose", {
          method: "POST",
          headers: buildApiHeaders(),
          body: JSON.stringify({ fault: fault.trim() }),
        });
        const data = await fallback.json();
        if (data.steps) {
          setDiagnosis(data);
          setTraceSteps(data.reasoning_trace ?? []);
        }
      } catch {
        setError("Could not complete diagnosis.");
      }
    } finally {
      setIsDiagnosing(false);
      setIsStreaming(false);
    }
  }, [fault, email]);

  const generateOutputs = async () => {
    if (!diagnosis) return;
    setGeneratingOutputs(true);
    try {
      const headers = buildApiHeaders();
      const body = JSON.stringify({ fault: fault.trim(), diagnosis });
      const [woRes, hoRes] = await Promise.all([
        fetch("/api/generate/work-order", { method: "POST", headers, body }),
        fetch("/api/generate/handover", { method: "POST", headers, body }),
      ]);
      const woData = await woRes.json();
      const hoData = await hoRes.json();
      setWorkOrder(woData.workOrder ?? null);
      setHandover(hoData.handover ?? null);
    } catch {
      setError("Failed to generate work order and handover.");
    } finally {
      setGeneratingOutputs(false);
    }
  };

  const downAsset = assets.find((a) => a.status === "down");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sage-900">Fault diagnosis</h1>
        <p className="mt-1 text-muted-foreground">
          Describe what you see. Shift Sage searches your plant history and returns a cited plan.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {assets.slice(0, 4).map((asset) => (
          <Card
            key={asset.id}
            className={asset.status === "down" ? "border-red-300 bg-red-50/50" : ""}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.line}</p>
              </div>
              <StatusBadge status={asset.status} pulse={asset.status === "down"} />
            </CardContent>
          </Card>
        ))}
      </div>

      {downAsset && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{downAsset.name}</strong> is currently DOWN. Paste your fault report below.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fault report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Tech ID (optional)
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="demo@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="prompt">What&apos;s happening?</Label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder="e.g. packing line 3 dead, swapped prox sensor and relay, PLC looks fine, still nothing"
                  value={fault}
                  onChange={(e) => setFault(e.target.value)}
                  className="mt-1.5 min-h-[140px] font-mono text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={runDiagnosis}
                  disabled={isDiagnosing}
                  className="bg-sage-600 hover:bg-sage-700"
                >
                  {isDiagnosing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Diagnosing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Diagnose
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={loadDemoFault} type="button">
                  <Play className="h-4 w-4" />
                  Load demo fault
                </Button>
                <Button
                  variant="outline"
                  onClick={startVoiceCapture}
                  disabled={listening}
                  type="button"
                >
                  <Mic className={`h-4 w-4 ${listening ? "text-red-500" : ""}`} />
                  {listening ? "Listening..." : "Voice input"}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          {(traceSteps.length > 0 || isStreaming) && (
            <ReasoningTrace steps={traceSteps} isStreaming={isStreaming} />
          )}
        </div>

        <div className="space-y-4">
          {diagnosis?.history_thin && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Insufficient plant history</p>
                  <p className="mt-1 text-sm text-amber-800">
                    We could not match this fault to enough historical work orders. Shift Sage
                    refuses to recommend uncited fixes. Try a more specific asset name or{" "}
                    <Link href="/settings" className="underline">
                      add API keys
                    </Link>{" "}
                    for broader search.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {diagnosis && !diagnosis.history_thin && diagnosis.steps.length > 0 && (
            <>
              <DiagnosisPlan
                steps={diagnosis.steps}
                workarounds={diagnosis.workarounds}
                assetName={diagnosis.asset_name}
              />

              <div className="flex gap-2">
                <Button
                  onClick={generateOutputs}
                  disabled={generatingOutputs}
                  variant="secondary"
                >
                  {generatingOutputs ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Generate work order and handover
                </Button>
              </div>

              {(workOrder || handover || generatingOutputs) && (
                <OutputDrafts
                  workOrder={workOrder}
                  handover={handover}
                  loading={generatingOutputs}
                />
              )}
            </>
          )}

          {!diagnosis && !isDiagnosing && (
            <Card className="border-dashed">
              <CardContent className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <Sparkles className="mb-3 h-8 w-8 text-sage-400" />
                <p className="font-medium">No diagnosis yet</p>
                <p className="mt-1 max-w-xs text-sm">
                  Paste a fault report or load the demo fault, then hit Diagnose.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
