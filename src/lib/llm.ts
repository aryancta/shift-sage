import type { DiagnosisResult, HandoverDraft, WorkOrderDraft } from "./types";
import {
  CACHED_DIAGNOSIS,
  CACHED_HANDOVER,
  CACHED_WORK_ORDER,
  DEMO_FAULT,
} from "./seed-data";
import {
  buildReasoningTrace,
  detectAssetFromFault,
  getWorkaroundsForAsset,
  getWorkOrdersForAsset,
  searchWorkOrders,
} from "./retrieval";

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  mistral?: string;
}

function normalizeFault(fault: string): string {
  return fault.trim().toLowerCase();
}

function isDemoFault(fault: string): boolean {
  const n = normalizeFault(fault);
  const demo = normalizeFault(DEMO_FAULT);
  return n === demo || (n.includes("packing line 3") && n.includes("prox") && n.includes("dead"));
}

export function buildMockDiagnosis(fault: string): DiagnosisResult {
  if (isDemoFault(fault)) {
    return { ...CACHED_DIAGNOSIS, mode: "mock" };
  }

  const asset = detectAssetFromFault(fault);
  if (!asset) {
    return {
      asset_id: "",
      asset_name: "Unknown",
      steps: [],
      workarounds: [],
      reasoning_trace: [
        "Parsing fault report...",
        "Could not match fault to a known asset in plant registry",
        "Insufficient history - refusing to generate uncited recommendations",
      ],
      cleaned_fault: fault,
      history_thin: true,
      mode: "mock",
    };
  }

  const matches = searchWorkOrders(fault, asset.id);
  const history = getWorkOrdersForAsset(asset.id);
  const workarounds = getWorkaroundsForAsset(asset.id);

  if (history.length < 2) {
    return {
      asset_id: asset.id,
      asset_name: asset.name,
      steps: [],
      workarounds: [],
      reasoning_trace: buildReasoningTrace(fault, asset, matches, workarounds),
      cleaned_fault: fault,
      history_thin: true,
      mode: "mock",
    };
  }

  const topMatches = (matches.length > 0 ? matches : history).slice(0, 4);
  const steps = topMatches.map((wo, i) => ({
    rank: i + 1,
    action: wo.resolution,
    rationale: wo.technician_notes.slice(0, 200),
    confidence: (wo.is_workaround ? "high" : "medium") as "high" | "medium" | "low",
    work_order_id: wo.id,
    wo_number: wo.wo_number,
    is_workaround: wo.is_workaround === 1,
    workaround_label: wo.workaround_label ?? undefined,
  }));

  const woSteps = workarounds.slice(0, 3).map((wo, i) => ({
    rank: i + 1,
    action: wo.workaround_label ?? wo.resolution,
    rationale: wo.technician_notes.slice(0, 200),
    confidence: "high" as const,
    work_order_id: wo.id,
    wo_number: wo.wo_number,
    is_workaround: true,
    workaround_label: wo.workaround_label ?? undefined,
  }));

  return {
    asset_id: asset.id,
    asset_name: asset.name,
    steps,
    workarounds: woSteps,
    reasoning_trace: buildReasoningTrace(fault, asset, topMatches, workarounds),
    cleaned_fault: fault,
    history_thin: false,
    mode: "mock",
  };
}

export function buildMockWorkOrder(fault: string, diagnosis?: DiagnosisResult): WorkOrderDraft {
  if (isDemoFault(fault)) return CACHED_WORK_ORDER;

  const assetName = diagnosis?.asset_name ?? "Unknown Asset";
  return {
    wo_number: `WO-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    asset_name: assetName,
    fault_summary: fault.slice(0, 100),
    cleaned_description: diagnosis?.cleaned_fault ?? fault,
    priority: "P2 - Production Impact",
    recommended_actions: diagnosis?.steps.map((s) => s.action).slice(0, 4) ?? [],
    estimated_downtime: "TBD pending diagnosis",
    parts_needed: [],
  };
}

export function buildMockHandover(fault: string, diagnosis?: DiagnosisResult): HandoverDraft {
  if (isDemoFault(fault)) return CACHED_HANDOVER;

  return {
    shift_summary: `Shift responded to fault on ${diagnosis?.asset_name ?? "plant equipment"}. ${fault.slice(0, 120)}`,
    open_issues: diagnosis?.history_thin
      ? ["Insufficient historical data for full diagnosis"]
      : ["Monitor asset through next production run"],
    completed_today: diagnosis?.steps.slice(0, 2).map((s) => s.action) ?? [],
    watch_items: diagnosis?.workarounds.map((w) => w.workaround_label ?? w.action) ?? [],
    next_shift_priority: "Verify repair holds through morning run",
  };
}

async function callGroq(
  apiKey: string,
  system: string,
  user: string
): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callGemini(
  apiKey: string,
  system: string,
  user: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function callMistral(
  apiKey: string,
  system: string,
  user: string
): Promise<string | null> {
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callLlm(
  keys: ApiKeys,
  system: string,
  user: string
): Promise<{ text: string | null; provider: string }> {
  if (keys.gemini) {
    const text = await callGemini(keys.gemini, system, user);
    if (text) return { text, provider: "gemini" };
  }
  if (keys.groq) {
    const text = await callGroq(keys.groq, system, user);
    if (text) return { text, provider: "groq" };
  }
  if (keys.mistral) {
    const text = await callMistral(keys.mistral, system, user);
    if (text) return { text, provider: "mistral" };
  }
  return { text: null, provider: "none" };
}

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function diagnoseFault(
  fault: string,
  keys: ApiKeys
): Promise<DiagnosisResult> {
  if (isDemoFault(fault) && !keys.gemini && !keys.groq && !keys.mistral) {
    return { ...CACHED_DIAGNOSIS, mode: "cached" };
  }

  const asset = detectAssetFromFault(fault);
  const history = asset ? getWorkOrdersForAsset(asset.id) : searchWorkOrders(fault);
  const workarounds = asset ? getWorkaroundsForAsset(asset.id) : [];

  if (!asset || history.length < 2) {
    const mock = buildMockDiagnosis(fault);
    return mock;
  }

  const hasKeys = keys.gemini || keys.groq || keys.mistral;
  if (!hasKeys) {
    return buildMockDiagnosis(fault);
  }

  const system = `You are Shift Sage, a maintenance diagnostic agent for a manufacturing plant.
You MUST only recommend actions that appear in the provided work order history.
Every step MUST cite a specific work_order_id and wo_number from the history.
If a fix is marked is_workaround=1, flag it as tribal knowledge.
Return ONLY valid JSON matching this schema:
{
  "cleaned_fault": "string",
  "steps": [{"rank": 1, "action": "string", "rationale": "string", "confidence": "high|medium|low", "work_order_id": "string", "wo_number": "string", "is_workaround": boolean, "workaround_label": "string|null"}],
  "workarounds": [same shape as steps]
}
Do not invent fixes not in the history. Max 5 steps.`;

  const user = `Fault report: ${fault}

Asset: ${asset.name} (${asset.id})

Work order history:
${JSON.stringify(history, null, 2)}

Known workarounds:
${JSON.stringify(workarounds, null, 2)}`;

  const { text } = await callLlm(keys, system, user);
  if (!text) return buildMockDiagnosis(fault);

  const parsed = extractJson<{
    cleaned_fault: string;
    steps: DiagnosisResult["steps"];
    workarounds: DiagnosisResult["workarounds"];
  }>(text);

  if (!parsed || !parsed.steps?.length) return buildMockDiagnosis(fault);

  const validIds = new Set(history.map((h) => h.id));
  const validSteps = parsed.steps.filter((s) => validIds.has(s.work_order_id));
  if (validSteps.length === 0) return buildMockDiagnosis(fault);

  return {
    asset_id: asset.id,
    asset_name: asset.name,
    steps: validSteps,
    workarounds: (parsed.workarounds ?? []).filter((s) => validIds.has(s.work_order_id)),
    reasoning_trace: buildReasoningTrace(fault, asset, history, workarounds),
    cleaned_fault: parsed.cleaned_fault ?? fault,
    history_thin: false,
    mode: "live",
  };
}

export async function generateWorkOrder(
  fault: string,
  diagnosis: DiagnosisResult,
  keys: ApiKeys
): Promise<WorkOrderDraft> {
  if (isDemoFault(fault) && !keys.gemini && !keys.groq && !keys.mistral) {
    return CACHED_WORK_ORDER;
  }

  const hasKeys = keys.gemini || keys.groq || keys.mistral;
  if (!hasKeys) return buildMockWorkOrder(fault, diagnosis);

  const system = `Generate a standardized CMMS work order draft as JSON:
{"wo_number":"WO-2025-XXXX","asset_name":"string","fault_summary":"string","cleaned_description":"string","priority":"string","recommended_actions":["string"],"estimated_downtime":"string","parts_needed":["string"]}
Use only information from the diagnosis. Return ONLY JSON.`;

  const user = `Fault: ${fault}\nDiagnosis: ${JSON.stringify(diagnosis)}`;
  const { text } = await callLlm(keys, system, user);
  if (!text) return buildMockWorkOrder(fault, diagnosis);
  const parsed = extractJson<WorkOrderDraft>(text);
  return parsed ?? buildMockWorkOrder(fault, diagnosis);
}

export async function generateHandover(
  fault: string,
  diagnosis: DiagnosisResult,
  keys: ApiKeys
): Promise<HandoverDraft> {
  if (isDemoFault(fault) && !keys.gemini && !keys.groq && !keys.mistral) {
    return CACHED_HANDOVER;
  }

  const hasKeys = keys.gemini || keys.groq || keys.mistral;
  if (!hasKeys) return buildMockHandover(fault, diagnosis);

  const system = `Generate a shift handover note as JSON:
{"shift_summary":"string","open_issues":["string"],"completed_today":["string"],"watch_items":["string"],"next_shift_priority":"string"}
Plain language for incoming crew. Return ONLY JSON.`;

  const user = `Fault: ${fault}\nDiagnosis: ${JSON.stringify(diagnosis)}`;
  const { text } = await callLlm(keys, system, user);
  if (!text) return buildMockHandover(fault, diagnosis);
  const parsed = extractJson<HandoverDraft>(text);
  return parsed ?? buildMockHandover(fault, diagnosis);
}

export async function streamReasoningStep(
  keys: ApiKeys,
  step: string
): Promise<string> {
  if (!keys.groq && !keys.gemini && !keys.mistral) return step;

  const system = "Rephrase this maintenance agent reasoning step in one concise line. No markdown.";
  const { text } = await callLlm(keys, system, step);
  return text?.trim().split("\n")[0] ?? step;
}

export function extractApiKeys(headers: Headers): ApiKeys {
  return {
    gemini: headers.get("x-user-gemini-key") ?? undefined,
    groq: headers.get("x-user-groq-key") ?? undefined,
    mistral: headers.get("x-user-mistral-key") ?? undefined,
  };
}

export function hasApiKeys(keys: ApiKeys): boolean {
  return Boolean(keys.gemini || keys.groq || keys.mistral);
}
