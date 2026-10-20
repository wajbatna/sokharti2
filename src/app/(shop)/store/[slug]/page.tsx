import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bike, Clock, Info, MapPin, ShoppingBag, Star, Timer } from "lucide-react";
import { StoreMenu } from "@/components/store/StoreMenu";
import { FavoriteButton } from "@/components/store/StoreCard";
import { ShareButton } from "@/components/store/ShareButton";
import { Badge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteStoreIds, getStoreBySlug } from "@/lib/queries";
import { formatDateAr, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "المحل غير موجود" };
  return {
    title: store.name,
    description: store.description ?? `اطلب من ${store.name} عبر سخرتي وتوصل لباب دارك.`,
    alternates: { canonical: `/store/${store.slug}` },
    openGraph: {
      title: `${store.name} — سخرتي`,
      description: store.description ?? "",
      images: store.coverUrl ? [store.coverUrl] : [],
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const user = await getCurrentUser();
  const favorites = await getFavoriteStoreIds(user?.id);

  const cartStore = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    logoUrl: store.logoUrl,
    deliveryFee: store.deliveryFee,
    minOrder: store.minOrder,
    etaMin: store.deliveryMinMinutes,
    etaMax: store.deliveryMaxMinutes,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": store.kind === "restaurant" ? "Restaurant" : "Store",
    name: store.name,
    image: store.coverUrl,
    address: { "@type": "PostalAddress", streetAddress: store.address, addressLocality: store.city, addressCountry: "MA" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: store.rating, reviewCount: store.reviewCount },
  };

  return (
    <div className="pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative h-52 w-full overflow-hidden bg-gray-200 md:h-72">
        {store.coverUrl ? <Image src={store.coverUrl} alt={store.name} fill sizes="100vw" className="object-cover" priority /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <FavoriteButton storeId={store.id} initial={favorites.includes(store.id)} />
          <ShareButton title={store.name} />
        </div>
        {!store.isOpen ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#111827]">المحل مغلق حالياً</span>
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="-mt-14 rounded-3xl bg-white p-5 shadow-[0_10px_40px_-28px_rgba(17,24,39,0.7)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} width={88} height={88} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white md:h-22 md:w-22" />
            ) : null}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#111827] md:text-3xl">{store.name}</h1>
                {store.discountLabel ? <Badge tone="brand">{store.discountLabel}</Badge> : null}
                {store.freeDelivery ? <Badge tone="success">توصيل مجاني</Badge> : null}
                <Badge tone={store.isOpen ? "success" : "default"}>{store.isOpen ? "مفتوح" : "مغلق"}</Badge>
              </div>
              <p className="text-sm text-gray-500">{store.description}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {store.rating.toFixed(1)}
                  <span className="text-gray-400">({store.reviewCount} تقييم)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-[#FF6B35]" /> {store.deliveryMinMinutes}–{store.deliveryMaxMinutes} دقيقة
                </span>
                <span className="flex items-center gap-1">
                  <Bike className="h-4 w-4 text-[#FF6B35]" /> توصيل {store.deliveryFee === 0 ? "مجاني" : money(store.deliveryFee)}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4 text-[#FF6B35]" /> حد أدنى {money(store.minOrder)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#FF6B35]" /> {store.city} · {store.distanceKm} كلم
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
          <div>
            <StoreMenu
              store={cartStore}
              sections={store.sections}
              products={store.products.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                imageUrl: p.imageUrl,
                price: p.price,
                oldPrice: p.oldPrice,
                discountPercent: p.discountPercent,
                isPopular: p.isPopular,
                isAvailable: p.isAvailable,
                sectionId: p.sectionId,
                extras: p.extras.map((e) => ({ id: e.id, name: e.name, price: e.price })),
              }))}
            />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                <Timer className="h-4 w-4 text-[#FF6B35]" /> أوقات العمل
              </h3>
              <ul className="space-y-1.5 text-xs">
                {store.hours.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-gray-600">
                    <span className="font-bold">{DAYS[h.dayOfWeek]}</span>
                    <span>{h.isClosed ? "مغلق" : `${h.openTime} - ${h.closeTime}`}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                <Info className="h-4 w-4 text-[#FF6B35]" /> معلومات المحل
              </h3>
              <dl className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between gap-2">
                  <dt className="font-bold">العنوان</dt>
                  <dd className="text-left">{store.address}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold">الهاتف</dt>
                  <dd dir="ltr">{store.phone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-bold">التصنيف</dt>
                  <dd>{store.category?.name ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl bg-white p-5">
              <h3 className="mb-3 text-sm font-extrabold text-[#111827]">آراء الزبناء</h3>
              {!store.reviews.length ? (
                <p className="text-xs text-gray-500">ما كاين حتى تقييم دابا.</p>
              ) : (
                <ul className="space-y-3">
                  {store.reviews.slice(0, 5).map((review) => (
                    <li key={review.id} className="rounded-2xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#111827]">{review.authorName}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {review.rating}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{review.comment}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{formatDateAr(review.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/account/orders" className="mt-3 block text-center text-xs font-bold text-[#FF6B35] hover:underline">
                قيّم طلبك السابق
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
