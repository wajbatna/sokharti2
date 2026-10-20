"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/providers";

export function ShareButton({ title }: { title: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      aria-label="مشاركة"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
          } else {
            await navigator.clipboard.writeText(url);
            toast.push("تنسخ الرابط ✓");
          }
        } catch {
          /* user cancelled */
        }
      }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-105"
    >
      <Share2 className="h-4 w-4 text-gray-600" />
    </button>
  );
}
