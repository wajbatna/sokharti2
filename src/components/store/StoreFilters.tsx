"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { id: "recommended", label: "موصى به" },
  { id: "rating", label: "الأعلى تقييماً" },
  { id: "delivery_time", label: "الأسرع" },
  { id: "delivery_fee", label: "أرخص توصيل" },
  { id: "distance", label: "الأقرب" },
];

const TOGGLES = [
  { id: "free", label: "توصيل مجاني" },
  { id: "open", label: "مفتوح الآن" },
  { id: "offers", label: "فيه عروض" },
  { id: "top", label: "تقييم +4.5" },
];

export function StoreFilters({
  categories,
  cities,
}: {
  categories: { id: number; slug: string; name: string }[];
  cities: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value?: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const active = (key: string, value: string) => params.get(key) === value;
  const hasFilters = Array.from(params.keys()).some((k) => k !== "page");

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <button
          onClick={() => update("category", null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
            !params.get("category") ? "bg-[#111827] text-white" : "bg-white text-gray-600 hover:bg-gray-100",
          )}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => update("category", cat.slug)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
              active("category", cat.slug) ? "bg-[#111827] text-white" : "bg-white text-gray-600 hover:bg-gray-100",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500">
          <SlidersHorizontal className="h-4 w-4" /> فلترة
        </span>
        {TOGGLES.map((t) => (
          <button
            key={t.id}
            onClick={() => update(t.id, params.get(t.id) ? null : "1")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
              params.get(t.id) ? "border-[#FF6B35] bg-[#FFF1EB] text-[#E4551F]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
            )}
          >
            {t.label}
          </button>
        ))}

        <select
          value={params.get("city") ?? ""}
          onChange={(e) => update("city", e.target.value || null)}
          className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 outline-none"
        >
          <option value="">كل المدن</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={params.get("sort") ?? "recommended"}
          onChange={(e) => update("sort", e.target.value)}
          className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
          >
            <X className="h-3.5 w-3.5" /> مسح الفلاتر
          </button>
        ) : null}
      </div>
    </div>
  );
}
