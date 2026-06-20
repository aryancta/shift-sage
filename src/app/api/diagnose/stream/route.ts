import { buildMockDiagnosis, diagnoseFault, extractApiKeys } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const fault = body.fault?.trim();

  if (!fault || fault.length < 5) {
    return new Response(JSON.stringify({ error: "Invalid fault" }), { status: 400 });
  }

  const keys = extractApiKeys(request.headers);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let result;
        const mockPreview = buildMockDiagnosis(fault);
        const trace = mockPreview.reasoning_trace;

        for (let i = 0; i < trace.length; i++) {
          await new Promise((r) => setTimeout(r, 350));
          send("trace", { step: trace[i], index: i });
        }

        result = await diagnoseFault(fault, keys);
        send("result", result);
        send("done", { ok: true });
      } catch {
        send("error", { message: "Diagnosis stream failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
