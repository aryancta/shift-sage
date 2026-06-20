import { NextResponse } from "next/server";
import {
  extractApiKeys,
  generateWorkOrder,
  diagnoseFault,
} from "@/lib/llm";
import type { DiagnosisResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fault = body.fault?.trim();
    let diagnosis: DiagnosisResult | undefined = body.diagnosis;

    if (!fault) {
      return NextResponse.json({ error: "Fault required" }, { status: 400 });
    }

    const keys = extractApiKeys(request.headers);

    if (!diagnosis) {
      diagnosis = await diagnoseFault(fault, keys);
    }

    const workOrder = await generateWorkOrder(fault, diagnosis, keys);
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate work order" },
      { status: 500 }
    );
  }
}
