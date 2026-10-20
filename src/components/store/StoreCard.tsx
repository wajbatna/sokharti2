"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Bike, Clock, Heart, MapPin, Star } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/account";
import { useToast } from "@/components/providers";
import { cn, money } from "@/lib/utils";

export type StoreCardData = {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minOrder?: number;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
  distanceKm?: number;
  isOpen: boolean;
  isNew?: boolean;
  freeDelivery?: boolean;
  discountLabel?: string | null;
  categoryName?: string | null;
  kind?: string;
};

export function FavoriteButton({
  storeId,
  productId,
  initial = false,
  className,
}: {
  storeId?: number;
  productId?: number;
  initial?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      aria-label="أضف إلى المفضلة"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !active;
        setActive(next);
        startTransition(async () => {
          const res = await toggleFavoriteAction({ storeId, productId });
          if (!res.ok) {
            setActive(!next);
            toast.push(res.error, "error");
          } else {
            toast.push(next ? "تزادت للمفضلة ❤️" : "تحيدات من المفضلة");
          }
        });
      }}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur transition hover:scale-105",
        className,
      )}
    >
      <Heart className={cn("h-4.5 w-4.5 transition", active ? "fill-rose-500 text-rose-500" : "text-gray-500")} />
    </button>
  );
}

export function StoreCard({ store, favorite = false, className }: { store: StoreCardData; favorite?: boolean; className?: string }) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_-14px_rgba(17,24,39,0.4)] ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(17,24,39,0.5)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {store.coverUrl ? (
          <Image
            src={store.coverUrl}
            alt={store.name}
            fill
            sizes="(max-width: 768px) 80vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {store.discountLabel ? (
            <span className="rounded-full bg-[#FF6B35] px-2.5 py-1 text-[11px] font-extrabold text-white shadow">{store.discountLabel}</span>
          ) : null}
          {store.freeDelivery ? (
            <span className="rounded-full bg-[#22C55E] px-2.5 py-1 text-[11px] font-extrabold text-white shadow">توصيل مجاني</span>
          ) : null}
          {store.isNew ? (
            <span className="rounded-full bg-[#111827] px-2.5 py-1 text-[11px] font-extrabold text-white shadow">جديد</span>
          ) : null}
        </div>

        <div className="absolute left-3 top-3">
          <FavoriteButton storeId={store.id} initial={favorite} />
        </div>

        {!store.isOpen ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-[#111827]">مغلق حالياً</span>
          </div>
        ) : null}

        {store.logoUrl ? (
          <div className="absolute -bottom-6 right-4 h-14 w-14 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
            <Image src={store.logoUrl} alt={store.name} width={56} height={56} className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div className="space-y-2 p-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-extrabold text-[#111827]">{store.name}</h3>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-50 px-1.5 py-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-extrabold">{store.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({store.reviewCount})</span>
          </span>
        </div>

        <p className="truncate text-xs text-gray-500">{store.categoryName ?? "محل"}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#FF6B35]" />
            {store.deliveryMinMinutes}–{store.deliveryMaxMinutes} د
          </span>
          <span className="flex items-center gap-1">
            <Bike className="h-3.5 w-3.5 text-[#FF6B35]" />
            {store.deliveryFee === 0 ? "مجاني" : money(store.deliveryFee)}
          </span>
          {typeof store.distanceKm === "number" ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#FF6B35]" />
              {store.distanceKm} كلم
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
