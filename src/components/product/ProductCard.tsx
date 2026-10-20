"use client";

import Image from "next/image";
import { useState } from "react";
import { Flame, Minus, Plus } from "lucide-react";
import { Button, Sheet, Textarea } from "@/components/ui";
import { FavoriteButton } from "@/components/store/StoreCard";
import { useCart, useToast, type CartStore } from "@/components/providers";
import { cn, money } from "@/lib/utils";

export type ProductData = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  oldPrice: number | null;
  discountPercent: number;
  isPopular: boolean;
  isAvailable: boolean;
  extras: { id: number; name: string; price: number }[];
};

export function ProductCard({ product, store }: { product: ProductData; store: CartStore }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => product.isAvailable && setOpen(true)}
        disabled={!product.isAvailable}
        className={cn(
          "group flex w-full gap-4 rounded-3xl border border-gray-100 bg-white p-3 text-right transition hover:border-[#FF6B35]/40 hover:shadow-[0_14px_30px_-22px_rgba(17,24,39,0.6)]",
          !product.isAvailable && "opacity-60",
        )}
      >
        <div className="min-w-0 flex-1 space-y-1.5 py-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-extrabold text-[#111827]">{product.name}</h3>
            {product.isPopular ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF1EB] px-2 py-0.5 text-[10px] font-extrabold text-[#E4551F]">
                <Flame className="h-3 w-3" /> الأكثر طلباً
              </span>
            ) : null}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{product.description}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[15px] font-extrabold text-[#111827]">{money(product.price)}</span>
            {product.oldPrice ? <span className="text-xs text-gray-400 line-through">{money(product.oldPrice)}</span> : null}
            {product.discountPercent ? (
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">-{product.discountPercent}%</span>
            ) : null}
          </div>
          {!product.isAvailable ? <span className="text-xs font-bold text-rose-500">غير متوفر حالياً</span> : null}
        </div>

        <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="104px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : null}
          {product.isAvailable ? (
            <span className="absolute bottom-1.5 left-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6B35] text-white shadow-md transition group-hover:scale-110">
              <Plus className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </button>

      <ProductSheet product={product} store={store} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ProductSheet({
  product,
  store,
  open,
  onClose,
}: {
  product: ProductData;
  store: CartStore;
  open: boolean;
  onClose: () => void;
}) {
  const { addLine, setDrawerOpen } = useCart();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  const extras = product.extras.filter((e) => selected.includes(e.id));
  const unit = product.price + extras.reduce((s, e) => s + e.price, 0);
  const total = unit * quantity;

  const add = () => {
    const { replaced } = addLine(store, {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePrice: product.price,
      quantity,
      notes,
      extras: extras.map((e) => ({ id: e.id, name: e.name, price: e.price })),
    });
    onClose();
    setQuantity(1);
    setSelected([]);
    setNotes("");
    toast.push(replaced ? "بدلنا السلة للمحل الجديد" : "تزاد للسلة ✓");
    setDrawerOpen(true);
  };

  return (
    <Sheet open={open} onClose={onClose} side="bottom" label={product.name} className="sm:max-w-xl">
      <div className="relative h-56 w-full shrink-0 overflow-hidden bg-gray-100 sm:rounded-t-3xl">
        {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="600px" className="object-cover" /> : null}
        <div className="absolute left-4 top-16 sm:top-4">
          <FavoriteButton productId={product.id} />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold text-[#111827]">{product.name}</h2>
            <div className="text-left">
              <p className="text-lg font-extrabold text-[#FF6B35]">{money(product.price)}</p>
              {product.oldPrice ? <p className="text-xs text-gray-400 line-through">{money(product.oldPrice)}</p> : null}
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{product.description}</p>
        </div>

        {product.extras.length ? (
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-[#111827]">الإضافات</h3>
            <div className="space-y-2">
              {product.extras.map((extra) => {
                const checked = selected.includes(extra.id);
                return (
                  <label
                    key={extra.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition",
                      checked ? "border-[#FF6B35] bg-[#FFF1EB]" : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelected((s) => (checked ? s.filter((id) => id !== extra.id) : [...s, extra.id]))}
                        className="h-4 w-4 accent-[#FF6B35]"
                      />
                      <span className="text-sm font-bold text-gray-800">{extra.name}</span>
                    </span>
                    <span className="text-sm font-extrabold text-gray-600">{extra.price ? `+ ${money(extra.price)}` : "مجاناً"}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-sm font-extrabold text-[#111827]">ملاحظات</h3>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: بلا بصلة عافاك" />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-full border border-gray-200 px-2 py-1.5">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="text-gray-600" aria-label="ناقص">
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-6 text-center text-sm font-extrabold">{quantity}</span>
          <button onClick={() => setQuantity((q) => Math.min(30, q + 1))} className="text-[#FF6B35]" aria-label="زيد">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button size="lg" className="flex-1" onClick={add}>
          أضف إلى السلة — {money(total)}
        </Button>
      </div>
    </Sheet>
  );
}
