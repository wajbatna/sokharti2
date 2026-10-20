"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, History, Search, Star, TrendingUp, X } from "lucide-react";
import { StoreCard, type StoreCardData } from "@/components/store/StoreCard";
import { EmptyState, GridSkeleton } from "@/components/ui";
import { cn, money } from "@/lib/utils";

type ProductResult = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  storeSlug: string;
  storeName: string;
};

type Results = { stores: StoreCardData[]; products: ProductResult[]; categories: { slug: string; name: string; kind: string }[] };

const RECENT_KEY = "sakhrti.recent-searches";

export function SearchClient({
  initialQuery,
  popular,
  categories,
}: {
  initialQuery: string;
  popular: string[];
  categories: { slug: string; name: string; kind: string }[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [filters, setFilters] = useState({ open: false, free: false, top: false, fast: false });
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as Results;
      setResults(data);
      setLoading(false);
      setRecent((prev) => {
        const next = [query.trim(), ...prev.filter((r) => r !== query.trim())].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const filteredStores = useMemo(() => {
    if (!results) return [];
    return results.stores.filter((s) => {
      if (filters.open && !s.isOpen) return false;
      if (filters.free && !s.freeDelivery) return false;
      if (filters.top && s.rating < 4.5) return false;
      if (filters.fast && s.deliveryMaxMinutes > 35) return false;
      return true;
    });
  }, [results, filters]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="شنو بغيتي اليوم؟"
          className="h-16 w-full rounded-3xl border border-gray-200 bg-white pe-5 ps-14 text-base font-bold outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10"
        />
        {query ? (
          <button onClick={() => setQuery("")} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="مسح">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {query ? (
        <div className="flex flex-wrap gap-2">
          {[
            { id: "open", label: "مفتوح الآن" },
            { id: "free", label: "توصيل مجاني" },
            { id: "top", label: "تقييم +4.5" },
            { id: "fast", label: "توصيل سريع" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilters((prev) => ({ ...prev, [f.id]: !prev[f.id as keyof typeof filters] }))}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-bold transition",
                filters[f.id as keyof typeof filters]
                  ? "border-[#FF6B35] bg-[#FFF1EB] text-[#E4551F]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {!query ? (
        <div className="space-y-7">
          {recent.length ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                <History className="h-4 w-4 text-gray-400" /> عمليات بحث سابقة
              </h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => setQuery(r)} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-100 hover:bg-gray-50">
                    {r}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
              <TrendingUp className="h-4 w-4 text-[#FF6B35]" /> الأكثر بحثاً
            </h2>
            <div className="flex flex-wrap gap-2">
              {popular.map((p) => (
                <button key={p} onClick={() => setQuery(p)} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-100 hover:bg-[#FFF1EB] hover:text-[#E4551F]">
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-extrabold text-[#111827]">تصفح حسب التصنيف</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.kind === "store" ? "stores" : "restaurants"}?category=${c.slug}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-600 ring-1 ring-gray-100 hover:bg-gray-50"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : loading ? (
        <GridSkeleton count={6} />
      ) : results && (filteredStores.length || results.products.length) ? (
        <div className="space-y-8">
          {filteredStores.length ? (
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-[#111827]">المحلات ({filteredStores.length})</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStores.map((s) => (
                  <StoreCard key={s.id} store={s} />
                ))}
              </div>
            </section>
          ) : null}

          {results.products.length ? (
            <section className="space-y-4">
              <h2 className="text-lg font-extrabold text-[#111827]">المنتجات ({results.products.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/store/${p.storeSlug}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100 transition hover:ring-[#FF6B35]/40"
                  >
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[#111827]">{p.name}</p>
                      <p className="truncate text-xs text-gray-500">{p.storeName}</p>
                      <p className="mt-1 text-sm font-extrabold text-[#FF6B35]">{money(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title={`ما لقينا والو على "${query}"`}
          description="جرب كلمة أخرى ولا تصفح التصنيفات."
        />
      )}
    </div>
  );
}

export function ResultMeta({ eta, rating }: { eta: string; rating: number }) {
  return (
    <span className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" /> {eta}
      </span>
      <span className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {rating}
      </span>
    </span>
  );
}
