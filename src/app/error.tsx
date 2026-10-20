"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[sakhrti]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#FF6B35] shadow-sm">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-extrabold text-[#111827]">وقع مشكل فالاتصال</h1>
      <p className="max-w-sm text-sm text-gray-500">ما قدرناش نجيبو البيانات دابا. تحقق من الاتصال وعاود المحاولة.</p>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4" /> إعادة المحاولة
      </Button>
    </div>
  );
}
