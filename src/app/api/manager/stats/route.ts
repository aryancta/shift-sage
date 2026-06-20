import { NextResponse } from "next/server";
import { getManagerStats } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getManagerStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load manager stats" },
      { status: 500 }
    );
  }
}
