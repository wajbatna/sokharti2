"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard, type ProductData } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui";
import type { CartStore } from "@/components/providers";
import { cn } from "@/lib/utils";

type Section = { id: number; name: string };

export function StoreMenu({
  store,
  sections,
  products,
}: {
  store: CartStore;
  sections: Section[];
  products: (ProductData & { sectionId: number | null })[];
}) {
  const [active, setActive] = useState<string>("popular");
  const [query, setQuery] = useState("");
  const containers = useRef<Record<string, HTMLDivElement | null>>({});

  const popular = useMemo(() => products.filter((p) => p.isPopular), [products]);
  const groups = useMemo(() => {
    const filtered = query
      ? products.filter((p) => p.name.includes(query) || (p.description ?? "").includes(query))
      : products;
    const base = [
      ...(popular.length && !query ? [{ id: "popular", name: "الأكثر طلباً", items: popular }] : []),
      ...sections.map((s) => ({ id: String(s.id), name: s.name, items: filtered.filter((p) => p.sectionId === s.id) })),
    ];
    const orphans = filtered.filter((p) => !sections.some((s) => s.id === p.sectionId));
    if (orphans.length) base.push({ id: "other", name: "منتجات أخرى", items: orphans });
    return base.filter((g) => g.items.length);
  }, [products, sections, popular, query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id.replace("section-", ""));
      },
      { rootMargin: "-180px 0px -65% 0px", threshold: 0 },
    );
    Object.values(containers.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [groups]);

  const scrollTo = (id: string) => {
    const el = containers.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-[64px] z-30 -mx-4 border-b border-gray-100 bg-[#F7F7F7]/95 px-4 py-3 backdrop-blur md:top-[72px] md:mx-0 md:rounded-2xl md:border md:px-4">
        <div className="flex items-center gap-3">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => scrollTo(group.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
                  active === group.id ? "bg-[#FF6B35] text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100",
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="relative hidden w-56 md:block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="قلب فالمنيو"
              className="h-10 w-full rounded-full border border-gray-200 bg-white ps-3 pe-9 text-sm outline-none focus:border-[#FF6B35]"
            />
          </div>
        </div>
      </div>

      {!groups.length ? (
        <EmptyState title="ما لقينا حتى منتج" description="جرب كلمة أخرى فالبحث" />
      ) : (
        groups.map((group) => (
          <div
            key={group.id}
            id={`section-${group.id}`}
            ref={(el) => {
              containers.current[group.id] = el;
            }}
            className="scroll-mt-40 space-y-3"
          >
            <h2 className="text-lg font-extrabold text-[#111827]">{group.name}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {group.items.map((product) => (
                <ProductCard key={`${group.id}-${product.id}`} product={product} store={store} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
