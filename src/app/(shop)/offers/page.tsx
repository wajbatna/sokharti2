import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Clock, Flame } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { listOffers } from "@/lib/queries";
import { formatDateAr, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "العروض",
  description: "أقوى العروض والخصومات على المطاعم والمتاجر فسخرتي — خصم حتى 30% وتوصيل مجاني.",
  alternates: { canonical: "/offers" },
};

export default async function OffersPage() {
  const offers = await listOffers();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-l from-[#FF6B35] to-[#E4551F] p-7 text-white md:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
          <Flame className="h-3.5 w-3.5" /> عروض سخرتي
        </span>
        <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">العروض 🔥</h1>
        <p className="mt-1 text-sm text-white/85">خصومات حقيقية من محلات مدينتك — كل يوم عروض جديدة</p>
      </header>

      {!offers.length ? (
        <EmptyState icon={<BadgePercent className="h-7 w-7" />} title="ما كاين حتى عرض دابا" description="رجع من بعد، كنزيدو عروض جديدة كل يوم." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map(({ offer, store }) => (
            <article
              key={offer.id}
              className="group overflow-hidden rounded-3xl bg-white ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(17,24,39,0.5)]"
            >
              <div className="relative aspect-[16/10] bg-gray-100">
                {offer.imageUrl ? (
                  <Image src={offer.imageUrl} alt={offer.title} fill sizes="400px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : null}
                <span className="absolute right-3 top-3 rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-extrabold text-white shadow">
                  -{offer.discountPercent}%
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  {store.logoUrl ? (
                    <Image src={store.logoUrl} alt={store.name} width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
                  ) : null}
                  <span className="text-xs font-bold text-gray-500">{store.name}</span>
                </div>
                <h2 className="text-base font-extrabold text-[#111827]">{offer.title}</h2>
                {offer.subtitle ? <p className="text-xs text-gray-500">{offer.subtitle}</p> : null}

                <div className="flex items-end gap-2">
                  {offer.newPrice ? <span className="text-xl font-extrabold text-[#FF6B35]">{money(offer.newPrice)}</span> : null}
                  {offer.oldPrice ? <span className="text-sm text-gray-400 line-through">{money(offer.oldPrice)}</span> : null}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-gray-500">
                  <span>توصيل {store.deliveryFee === 0 ? "مجاني" : money(store.deliveryFee)}</span>
                  <span>
                    {store.deliveryMinMinutes}–{store.deliveryMaxMinutes} دقيقة
                  </span>
                  {offer.endsAt ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> ينتهي {formatDateAr(offer.endsAt)}
                    </span>
                  ) : null}
                </div>

                <Link href={`/store/${store.slug}`} className="block">
                  <Button className="w-full">اطلب الآن</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
