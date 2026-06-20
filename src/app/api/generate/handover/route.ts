import { NextResponse } from "next/server";
import {
  extractApiKeys,
  generateHandover,
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

    const handover = await generateHandover(fault, diagnosis, keys);
    return NextResponse.json({ handover });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate handover" },
      { status: 500 }
    );
  }
}
