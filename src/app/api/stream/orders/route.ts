import { subscribe } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events bridge over PostgreSQL LISTEN/NOTIFY (no polling). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const storeId = searchParams.get("storeId");
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          /* stream closed */
        }
      };
      send(`retry: 4000\n\n`);
      send(`event: ready\ndata: {"ok":true}\n\n`);

      unsubscribe = await subscribe((event) => {
        if (code && event.orderCode !== code) return;
        if (storeId && String(event.storeId) !== storeId) return;
        send(`data: ${JSON.stringify(event)}\n\n`);
      });

      ping = setInterval(() => send(`: keep-alive\n\n`), 25000);
    },
    cancel() {
      unsubscribe?.();
      if (ping) clearInterval(ping);
    },
  });

  request.signal.addEventListener("abort", () => {
    unsubscribe?.();
    if (ping) clearInterval(ping);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
