import { NextResponse } from "next/server";
import { diagnoseFault, extractApiKeys, hasApiKeys } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fault = body.fault?.trim();

    if (!fault || fault.length < 5) {
      return NextResponse.json(
        { error: "Fault description must be at least 5 characters" },
        { status: 400 }
      );
    }

    const keys = extractApiKeys(request.headers);
    const result = await diagnoseFault(fault, keys);

    return NextResponse.json({
      ...result,
      live_mode: hasApiKeys(keys),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Diagnosis failed. Try again or use demo mode." },
      { status: 500 }
    );
  }
}
