"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleDot } from "lucide-react";
import { ORDER_FLOW, STATUS_LABEL, cn } from "@/lib/utils";

export function useOrderStream(code: string | undefined, onEvent?: () => void) {
  const router = useRouter();
  useEffect(() => {
    const url = code ? `/api/stream/orders?code=${encodeURIComponent(code)}` : "/api/stream/orders";
    const source = new EventSource(url);
    source.onmessage = () => {
      router.refresh();
      onEvent?.();
    };
    source.onerror = () => {
      /* EventSource retries automatically */
    };
    return () => source.close();
  }, [code, router, onEvent]);
}

export function LiveOrderRefresh({ code }: { code?: string }) {
  useOrderStream(code);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      تحديث مباشر
    </span>
  );
}

export function TrackingTimeline({ status, events }: { status: string; events: { status: string; createdAt: string | Date }[] }) {
  const currentIndex = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  const cancelled = status === "cancelled";

  return (
    <ol className="relative space-y-5 border-r-2 border-dashed border-gray-200 pe-0 ps-0 pr-5">
      {ORDER_FLOW.map((step, index) => {
        const done = !cancelled && index <= currentIndex;
        const active = !cancelled && index === currentIndex;
        const event = events.find((e) => e.status === step);
        return (
          <li key={step} className="relative">
            <span
              className={cn(
                "absolute -right-[30px] flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white",
                done ? "border-[#22C55E] text-[#22C55E]" : "border-gray-200 text-gray-300",
                active && "border-[#FF6B35] text-[#FF6B35]",
              )}
            >
              {done && !active ? <Check className="h-3.5 w-3.5" /> : <CircleDot className="h-3 w-3" />}
            </span>
            <p className={cn("text-sm font-extrabold", done ? "text-[#111827]" : "text-gray-400")}>{STATUS_LABEL[step]}</p>
            {event ? (
              <p className="text-[11px] text-gray-400">
                {new Date(event.createdAt).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : null}
          </li>
        );
      })}
      {cancelled ? (
        <li className="relative">
          <span className="absolute -right-[30px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-rose-400 bg-white text-rose-500">
            <CircleDot className="h-3 w-3" />
          </span>
          <p className="text-sm font-extrabold text-rose-600">تم إلغاء الطلب</p>
        </li>
      ) : null}
    </ol>
  );
}
