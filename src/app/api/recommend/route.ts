import { NextRequest, NextResponse } from "next/server";
import { generateAndPersistRecommendations, streamLLMAndPersist } from "@/lib/services/recommend";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const stream = request.nextUrl.searchParams.get("stream") === "1";

    if (stream) {
      const encoder = new TextEncoder();
      const streamBody = new ReadableStream({
        async start(controller) {
          try {
            const { id } = await streamLLMAndPersist(body, (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", chunk })}\n\n`));
            });
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done", id })}\n\n`)
            );
            controller.close();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Recommendation failed";
            const status = (error as Error & { status?: number }).status ?? 502;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", message, status })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(streamBody, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const result = await generateAndPersistRecommendations(body);
    return NextResponse.json(result);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/recommend]", error);
    return NextResponse.json({ error: message }, { status: status === 400 ? 400 : status >= 500 ? 500 : 502 });
  }
}
