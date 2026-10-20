"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { Button, EmptyState, Input, Sheet } from "@/components/ui";
import { useCart } from "@/components/providers";
import { validateCouponAction } from "@/lib/actions/orders";
import { money } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const { store, lines, subtotal, deliveryFee, serviceFee, setQuantity, removeLine, clear, drawerOpen, setDrawerOpen } = useCart();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; freeDelivery: boolean } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checking, setChecking] = useState(false);

  const effectiveDelivery = applied?.freeDelivery ? 0 : deliveryFee;
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal + effectiveDelivery + serviceFee - discount);
  const belowMin = store ? subtotal < store.minOrder : false;

  const applyCoupon = async () => {
    if (!store) return;
    setChecking(true);
    setCouponError("");
    const res = await validateCouponAction({ code: coupon, storeId: store.id, subtotal });
    setChecking(false);
    if (!res.ok) {
      setApplied(null);
      setCouponError(res.error);
      return;
    }
    setApplied(res.data!);
    if (typeof window !== "undefined") window.sessionStorage.setItem("sakhrti.coupon", res.data!.code);
  };

  const goCheckout = () => {
    setDrawerOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} side="right" label="سلة المشتريات" className="sm:max-w-md">
      <div className="flex items-center gap-3 border-b border-gray-100 p-5 pt-6">
        <ShoppingBag className="h-5 w-5 text-[#FF6B35]" />
        <h2 className="text-lg font-extrabold text-[#111827]">السلة</h2>
        {lines.length ? (
          <button onClick={clear} className="ms-auto flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline">
            <Trash2 className="h-3.5 w-3.5" /> إفراغ السلة
          </button>
        ) : null}
      </div>

      {!lines.length || !store ? (
        <div className="p-6">
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" />}
            title="السلة خاوية"
            description="زيد منتجات من المطاعم والمتاجر باش تكمل الطلب"
            action={
              <Button onClick={() => setDrawerOpen(false)} variant="secondary">
                تصفح المحلات
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
            ) : null}
            <div>
              <p className="text-sm font-extrabold text-[#111827]">{store.name}</p>
              <p className="text-xs text-gray-500">
                {store.etaMin}–{store.etaMax} دقيقة · توصيل {store.deliveryFee === 0 ? "مجاني" : money(store.deliveryFee)}
              </p>
            </div>
            <Link href={`/store/${store.slug}`} onClick={() => setDrawerOpen(false)} className="ms-auto text-xs font-bold text-[#FF6B35] hover:underline">
              زيد منتجات
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {lines.map((line) => {
              const unit = line.basePrice + line.extras.reduce((s, e) => s + e.price, 0);
              return (
                <div key={line.key} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt={line.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#111827]">{line.name}</p>
                    {line.extras.length ? (
                      <p className="truncate text-[11px] text-gray-500">+ {line.extras.map((e) => e.name).join("، ")}</p>
                    ) : null}
                    {line.notes ? <p className="truncate text-[11px] italic text-gray-400">“{line.notes}”</p> : null}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-gray-200 px-1">
                        <button onClick={() => setQuantity(line.key, line.quantity - 1)} className="p-1.5 text-gray-600" aria-label="ناقص">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-extrabold">{line.quantity}</span>
                        <button onClick={() => setQuantity(line.key, line.quantity + 1)} className="p-1.5 text-[#FF6B35]" aria-label="زيد">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-[#111827]">{money(unit * line.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeLine(line.key)} className="self-start text-gray-300 transition hover:text-rose-500" aria-label="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-gray-100 p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="كود الخصم"
                  className="h-11 ps-3 pe-9 text-sm"
                />
              </div>
              <Button variant="outline" size="md" onClick={applyCoupon} loading={checking}>
                تطبيق
              </Button>
            </div>
            {couponError ? <p className="text-xs font-bold text-rose-600">{couponError}</p> : null}
            {applied ? <p className="text-xs font-bold text-emerald-600">تم تطبيق الكود {applied.code} ✓</p> : null}

            <dl className="space-y-1.5 text-sm">
              <Row label="المجموع الفرعي" value={money(subtotal)} />
              <Row label="رسوم التوصيل" value={effectiveDelivery === 0 ? "مجاني" : money(effectiveDelivery)} />
              <Row label="رسوم الخدمة" value={money(serviceFee)} />
              {discount ? <Row label="الخصم" value={`- ${money(discount)}`} tone="green" /> : null}
              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-base font-extrabold text-[#111827]">
                <span>المجموع</span>
                <span>{money(total)}</span>
              </div>
            </dl>

            {belowMin ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
                باقي {money(store.minOrder - subtotal)} باش توصل للحد الأدنى
              </p>
            ) : null}

            <Button size="lg" className="w-full" disabled={belowMin} onClick={goCheckout}>
              متابعة الطلب · {money(total)}
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={tone === "green" ? "font-bold text-emerald-600" : "font-bold text-gray-800"}>{value}</dd>
    </div>
  );
}
