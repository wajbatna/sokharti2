import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bike, Clock, Headphones, MapPin, Phone, Receipt, Star } from "lucide-react";
import { LiveOrderRefresh, TrackingTimeline } from "@/components/order/OrderTracker";
import { MapPanel } from "@/components/order/MapPanel";
import { Badge, Button, Card } from "@/components/ui";
import { getOrderByCode } from "@/lib/queries";
import { getMapProvider, routePoint } from "@/lib/maps";
import { ORDER_FLOW, PAYMENT_LABEL, STATUS_COLOR, STATUS_LABEL, formatDateAr, money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "تتبع الطلب", robots: { index: false } };

export default async function OrderTrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await getOrderByCode(decodeURIComponent(code));
  if (!order) notFound();

  const storePos = { lat: order.store.lat ?? 33.2667, lng: order.store.lng ?? -7.5869 };
  const customerPos = { lat: order.lat ?? 33.2665, lng: order.lng ?? -7.5872 };
  const progress = Math.max(0, ORDER_FLOW.indexOf(order.status as "received")) / (ORDER_FLOW.length - 1);
  const driverPos = order.driver ? routePoint(storePos, customerPos, progress) : null;
  const provider = getMapProvider();
  const embedUrl = provider.name === "openstreetmap" ? null : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-500">رقم الطلب</p>
          <h1 className="text-2xl font-extrabold text-[#111827]">#{order.code}</h1>
          <p className="mt-1 text-xs text-gray-400">{formatDateAr(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <LiveOrderRefresh code={order.code} />
          <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#111827]">مسار التوصيل</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Clock className="h-4 w-4 text-[#FF6B35]" /> الوصول المتوقع: {order.etaMinutes} دقيقة
              </span>
            </div>
            <MapPanel storePos={storePos} customerPos={customerPos} driverPos={driverPos} embedUrl={embedUrl} progress={1 - progress} />
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={<MapPin className="h-4 w-4" />} title="عنوان التوصيل" value={order.addressText} />
              <InfoRow icon={<Receipt className="h-4 w-4" />} title="طريقة الأداء" value={`${PAYMENT_LABEL[order.paymentMethod]} · ${order.paymentStatus === "paid" ? "مؤدى" : "غير مؤدى"}`} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 text-base font-extrabold text-[#111827]">حالة الطلب</h2>
            <TrackingTimeline status={order.status} events={order.events} />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-extrabold text-[#111827]">تفاصيل الطلب</h2>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 border-b border-dashed border-gray-100 pb-2 last:border-0">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-[#111827]">
                      {item.quantity}× {item.name}
                    </p>
                    {item.extras.length ? <p className="text-[11px] text-gray-500">+ {item.extras.map((e) => e.name).join("، ")}</p> : null}
                    {item.notes ? <p className="text-[11px] italic text-gray-400">“{item.notes}”</p> : null}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{money(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 pt-2 text-sm">
              <SummaryRow label="المجموع الفرعي" value={money(order.subtotal)} />
              <SummaryRow label="رسوم التوصيل" value={order.deliveryFee === 0 ? "مجاني" : money(order.deliveryFee)} />
              <SummaryRow label="رسوم الخدمة" value={money(order.serviceFee)} />
              {order.discount ? <SummaryRow label={`الخصم ${order.couponCode ?? ""}`} value={`- ${money(order.discount)}`} /> : null}
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-base font-extrabold">
                <span>المجموع</span>
                <span>{money(order.total)}</span>
              </div>
            </dl>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827]">المحل</h2>
            <div className="flex items-center gap-3">
              {order.store.logoUrl ? (
                <Image src={order.store.logoUrl} alt={order.store.name} width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
              ) : null}
              <div>
                <p className="text-sm font-extrabold text-[#111827]">{order.store.name}</p>
                <p className="text-xs text-gray-500">{order.store.city}</p>
              </div>
            </div>
            <a href={`tel:${order.store.phone ?? ""}`} className="block">
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4" /> اتصل بالمحل
              </Button>
            </a>
            <Link href={`/store/${order.store.slug}`} className="block">
              <Button variant="ghost" className="w-full">
                زور صفحة المحل
              </Button>
            </Link>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827]">السائق</h2>
            {order.driver ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1EB] text-[#FF6B35]">
                    <Bike className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">{order.driver.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {order.driver.rating.toFixed(1)} · {order.driver.vehicle}
                    </p>
                  </div>
                </div>
                <a href={`tel:${order.driver.phone}`} className="block">
                  <Button className="w-full">
                    <Phone className="h-4 w-4" /> اتصل بالسائق
                  </Button>
                </a>
              </>
            ) : (
              <p className="rounded-2xl bg-gray-50 p-3 text-xs text-gray-500">غادي نعينو ليك سائق فاش يوجد الطلب.</p>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#111827]">تحتاج مساعدة؟</h2>
            <Badge tone="muted">الدعم متاح 24/7</Badge>
            <a href="tel:0808000000" className="block">
              <Button variant="outline" className="w-full">
                <Headphones className="h-4 w-4" /> تواصل مع الدعم
              </Button>
            </a>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3">
      <span className="mt-0.5 text-[#FF6B35]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-500">{title}</p>
        <p className="text-xs font-bold text-[#111827]">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-bold text-gray-800">{value}</dd>
    </div>
  );
}
