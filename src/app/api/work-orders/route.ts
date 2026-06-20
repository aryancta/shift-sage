import { NextResponse } from "next/server";
import { getAllWorkOrders } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workOrders = getAllWorkOrders();
    return NextResponse.json({ workOrders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load work orders" },
      { status: 500 }
    );
  }
}
