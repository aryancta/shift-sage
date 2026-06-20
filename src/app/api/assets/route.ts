import { NextResponse } from "next/server";
import { getAllAssets } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assets = getAllAssets();
    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load assets" },
      { status: 500 }
    );
  }
}
