"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui";
import { useLocation } from "@/components/providers";

export function HeroSearch() {
  const router = useRouter();
  const { location, openPicker } = useLocation();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
      className="flex w-full flex-col gap-3 rounded-3xl bg-white/95 p-3 shadow-[0_20px_45px_-30px_rgba(17,24,39,0.8)] backdrop-blur sm:flex-row"
    >
      <button
        type="button"
        onClick={openPicker}
        className="flex min-w-0 items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-right transition hover:bg-gray-100 sm:w-[230px]"
      >
        <MapPin className="h-4.5 w-4.5 shrink-0 text-[#FF6B35]" />
        <span className="truncate text-sm font-bold text-gray-700">{location ? `${location.city} — ${location.address}` : "أدخل عنوان التوصيل"}</span>
      </button>

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="شنو بغيتي اليوم؟ برغر، بيتزا، بقالة..."
          className="h-[52px] w-full rounded-2xl bg-gray-50 pe-4 ps-12 text-sm font-semibold outline-none transition focus:bg-white focus:ring-4 focus:ring-[#FF6B35]/10"
        />
      </div>

      <Button type="submit" size="lg" className="sm:w-auto">
        بحث
      </Button>
    </form>
  );
}
