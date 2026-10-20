"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { useCart } from "@/components/providers";
import { money } from "@/lib/utils";

export function CartPageClient() {
  const { store, lines, subtotal, deliveryFee, serviceFee, total, setQuantity, removeLine, hydrated } = useCart();

  if (!hydrated) return <div className="skeleton h-60 w-full rounded-3xl" />;

  if (!store || !lines.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-7 w-7" />}
        title="السلة خاوية"
        description="تصفح المطاعم والمتاجر وزيد لي عجبك للسلة."
        action={
          <Link href="/restaurants">
            <Button>تصفح المطاعم</Button>
          </Link>
        }
      />
    );
  }

  const belowMin = subtotal < store.minOrder;

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} width={44} height={44} className="h-11 w-11 rounded-xl object-cover" /> : null}
          <div>
            <p className="text-sm font-extrabold text-[#111827]">{store.name}</p>
            <p className="text-xs text-gray-500">
              {store.etaMin}–{store.etaMax} دقيقة · توصيل {store.deliveryFee === 0 ? "مجاني" : money(store.deliveryFee)}
            </p>
          </div>
          <Link href={`/store/${store.slug}`} className="ms-auto text-xs font-bold text-[#FF6B35] hover:underline">
            زيد منتجات
          </Link>
        </div>

        <ul className="space-y-3">
          {lines.map((line) => {
            const unit = line.basePrice + line.extras.reduce((s, e) => s + e.price, 0);
            return (
              <li key={line.key} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                {line.imageUrl ? (
                  <Image src={line.imageUrl} alt={line.name} width={72} height={72} className="h-18 w-18 rounded-xl object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#111827]">{line.name}</p>
                  {line.extras.length ? <p className="truncate text-[11px] text-gray-500">+ {line.extras.map((e) => e.name).join("، ")}</p> : null}
                  {line.notes ? <p className="truncate text-[11px] italic text-gray-400">“{line.notes}”</p> : null}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-gray-200 px-1">
                      <button onClick={() => setQuantity(line.key, line.quantity - 1)} className="p-1.5" aria-label="ناقص">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-5 text-center text-sm font-extrabold">{line.quantity}</span>
                      <button onClick={() => setQuantity(line.key, line.quantity + 1)} className="p-1.5 text-[#FF6B35]" aria-label="زيد">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-extrabold">{money(unit * line.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => removeLine(line.key)} className="self-start text-gray-300 hover:text-rose-500" aria-label="حذف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">المجموع الفرعي</span>
          <span className="font-bold">{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">رسوم التوصيل</span>
          <span className="font-bold">{deliveryFee === 0 ? "مجاني" : money(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">رسوم الخدمة</span>
          <span className="font-bold">{money(serviceFee)}</span>
        </div>
        <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-base font-extrabold">
          <span>المجموع</span>
          <span>{money(total)}</span>
        </div>
        {belowMin ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
            باقي {money(store.minOrder - subtotal)} باش توصل للحد الأدنى
          </p>
        ) : null}
        <Link href="/checkout" className="block pt-2">
          <Button size="lg" className="w-full" disabled={belowMin}>
            متابعة الطلب
          </Button>
        </Link>
      </Card>
    </div>
  );
}
