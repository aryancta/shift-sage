import { NextResponse } from "next/server";
import { getWorkOrderById } from "@/lib/retrieval";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = getWorkOrderById(params.id);
    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load work order" },
      { status: 500 }
    );
  }
}
