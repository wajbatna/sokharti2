import Link from "next/link";
import { Suspense } from "react";
import { BadgePercent, Clock3, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";
import { HeroSearch } from "@/components/home/HeroSearch";
import { CategoryRail } from "@/components/home/CategoryRail";
import { BannerSlider } from "@/components/home/BannerSlider";
import { StoreRail } from "@/components/store/StoreRail";
import { StoreCardSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteStoreIds, getHomeData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div className="pb-10">
      <section className="relative overflow-hidden bg-[#111827]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.5),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(228,85,31,0.35),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B35]" /> كلشي لي بغيتي... حتى لباب دارك
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-5xl">شنو بغيتي نوصلك اليوم؟</h1>
          <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">أكل، مشروبات، بقالة، صيدليات وأكثر — توصيل سريع فمدينتك.</p>
          <div className="mt-6 max-w-4xl">
            <HeroSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-white/75">
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-[#FF6B35]" /> توصيل فـ 30 دقيقة
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-[#FF6B35]" /> أزيد من 30 محل
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#FF6B35]" /> أداء آمن
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6 md:py-10">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </div>
  );
}

async function HomeContent() {
  const user = await getCurrentUser();
  const [data, favorites] = await Promise.all([getHomeData(), getFavoriteStoreIds(user?.id)]);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold text-[#111827] md:text-2xl">التصنيفات</h2>
          <Link href="/restaurants" className="text-sm font-bold text-[#FF6B35] hover:underline">
            شوف الكل
          </Link>
        </div>
        <CategoryRail categories={data.categories} />
      </section>

      <BannerSlider banners={data.banners} />

      <StoreRail title="الأكثر طلباً 🔥" subtitle="المحلات لي كيبغيو الناس فمنطقتك" stores={data.popular} href="/restaurants" favorites={favorites} />
      <StoreRail title="قريب منك" subtitle="أقل مسافة، أسرع توصيل" stores={data.nearby} href="/restaurants?sort=distance" favorites={favorites} />

      <section className="grid gap-4 rounded-3xl bg-white p-6 md:grid-cols-3">
        <Feature icon={<BadgePercent className="h-5 w-5" />} title="عروض كل يوم" text="خصومات حقيقية من المطاعم والمتاجر ديال مدينتك." />
        <Feature icon={<Truck className="h-5 w-5" />} title="تتبع مباشر" text="تبع طلبك خطوة بخطوة من التحضير حتى باب دارك." />
        <Feature icon={<Store className="h-5 w-5" />} title="محلات موثوقة" text="كل محل كيتأكد من طرف فريق سخرتي قبل النشر." />
      </section>

      <StoreRail title="الأعلى تقييماً ⭐" subtitle="أحسن تقييمات من الزبناء" stores={data.topRated} href="/restaurants?sort=rating" favorites={favorites} />
      <StoreRail title="عروض اليوم" subtitle="خصومات محدودة" stores={data.deals} href="/offers" favorites={favorites} />
      <StoreRail title="مطاعم جديدة" subtitle="وصلو جداد للمنصة" stores={data.newest} href="/restaurants" favorites={favorites} />
      <StoreRail title="توصيل مجاني 🚴" subtitle="بلا رسوم توصيل" stores={data.freeDelivery} href="/restaurants?free=1" favorites={favorites} />
      <StoreRail title="المتاجر والبقالة" subtitle="كلشي ديال الدار" stores={data.shops} href="/stores" favorites={favorites} />
    </>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1EB] text-[#FF6B35]">{icon}</span>
      <div>
        <h3 className="text-sm font-extrabold text-[#111827]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-[124px] shrink-0 rounded-3xl md:h-32 md:w-[150px]" />
        ))}
      </div>
      <div className="skeleton h-[190px] w-full rounded-3xl md:h-[260px]" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
