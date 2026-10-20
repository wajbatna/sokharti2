import type { Metadata } from "next";
import { Suspense } from "react";
import { StoreFilters } from "@/components/store/StoreFilters";
import { StoreGrid } from "@/components/store/StoreRail";
import { GridSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteStoreIds, listCategories, listStores } from "@/lib/queries";
import { CITIES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المطاعم",
  description: "تصفح أحسن المطاعم فمدينتك على سخرتي — برغر، بيتزا، تاكوس، سوشي وأكثر مع توصيل سريع.",
  alternates: { canonical: "/restaurants" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function RestaurantsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-2xl font-extrabold text-[#111827] md:text-3xl">المطاعم</h1>
        <p className="mt-1 text-sm text-gray-500">اختار من بين أحسن المطاعم وطلب فدقائق</p>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        <Listing sp={sp} kind="restaurant" />
      </Suspense>
    </div>
  );
}

export async function Listing({ sp, kind }: { sp: Record<string, string | string[] | undefined>; kind: "restaurant" | "store" }) {
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);
  const page = Math.max(1, Number(get("page") ?? 1));
  const perPage = 12;

  const [cats, user] = await Promise.all([listCategories(kind), getCurrentUser()]);
  const [{ items, total }, favorites] = await Promise.all([
    listStores({
      kind,
      category: get("category"),
      city: get("city"),
      q: get("q"),
      sort: (get("sort") as "rating" | undefined) ?? "recommended",
      freeDelivery: get("free") === "1",
      openNow: get("open") === "1",
      hasOffer: get("offers") === "1",
      minRating: get("top") === "1" ? 4.5 : undefined,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    getFavoriteStoreIds(user?.id),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => typeof v === "string" && k !== "page" && params.set(k, v));
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <StoreFilters categories={cats} cities={CITIES} />
      <p className="text-xs font-bold text-gray-500">{total} محل متاح</p>
      <StoreGrid stores={items} favorites={favorites} />
      {pages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pages }).map((_, i) => (
            <a
              key={i}
              href={buildHref(i + 1)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold transition ${
                page === i + 1 ? "bg-[#FF6B35] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
