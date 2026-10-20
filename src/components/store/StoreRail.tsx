import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StoreCard, type StoreCardData } from "@/components/store/StoreCard";
import { EmptyState } from "@/components/ui";
import { Store } from "lucide-react";

export function StoreRail({
  title,
  subtitle,
  stores,
  href,
  favorites = [],
}: {
  title: string;
  subtitle?: string;
  stores: StoreCardData[];
  href?: string;
  favorites?: number[];
}) {
  if (!stores.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827] md:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-bold text-[#FF6B35] hover:underline">
            شوف الكل <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="scroll-x no-scrollbar -mx-4 flex gap-4 px-4 pb-2 md:mx-0 md:px-0">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} favorite={favorites.includes(store.id)} className="w-[268px] shrink-0 md:w-[300px]" />
        ))}
      </div>
    </section>
  );
}

export function StoreGrid({ stores, favorites = [] }: { stores: StoreCardData[]; favorites?: number[] }) {
  if (!stores.length) {
    return (
      <EmptyState
        icon={<Store className="h-7 w-7" />}
        title="ما لقينا حتى محل"
        description="جرب تبدل الفلاتر أو المدينة باش تلقى محلات قريبة منك."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} favorite={favorites.includes(store.id)} />
      ))}
    </div>
  );
}
