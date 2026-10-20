"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Copy, Pencil, Power, Trash2 } from "lucide-react";
import { Button, Card, Select } from "@/components/ui";
import { useToast } from "@/components/providers";
import { deleteProductAction, duplicateProductAction, toggleProductAvailabilityAction } from "@/lib/actions/admin";
import { money } from "@/lib/utils";

export type ProductRow = {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  oldPrice: number | null;
  isAvailable: boolean;
  isPopular: boolean;
  stock: number;
  storeName: string;
  storeId: number;
};

export function ProductsTable({
  products,
  stores,
  editBase = "/admin/products",
}: {
  products: ProductRow[];
  stores: { id: number; name: string }[];
  editBase?: string;
}) {
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const list = products.filter(
    (p) => (!query || p.name.includes(query)) && (!storeFilter || p.storeId === Number(storeFilter)),
  );

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="قلب على منتج..."
          className="h-11 w-full max-w-xs rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-[#FF6B35]"
        />
        {stores.length > 1 ? (
          <Select className="h-11 w-56" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            <option value="">كل المحلات</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="pb-2 font-bold">المنتج</th>
              <th className="pb-2 font-bold">المحل</th>
              <th className="pb-2 font-bold">الثمن</th>
              <th className="pb-2 font-bold">المخزون</th>
              <th className="pb-2 font-bold">الحالة</th>
              <th className="pb-2 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {p.imageUrl ? <Image src={p.imageUrl} alt={p.name} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" /> : null}
                    <span className="font-extrabold text-[#111827]">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-gray-600">{p.storeName}</td>
                <td className="py-3">
                  <span className="font-bold">{money(p.price)}</span>
                  {p.oldPrice ? <span className="ms-1 text-[11px] text-gray-400 line-through">{money(p.oldPrice)}</span> : null}
                </td>
                <td className="py-3 text-gray-600">{p.stock}</td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${p.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isAvailable ? "متوفر" : "موقوف"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`${editBase}/${p.id}`}>
                      <Button size="icon" variant="ghost" aria-label="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="نسخ"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await duplicateProductAction(p.id);
                          toast.push(res.ok ? "تنسخ المنتج" : res.error, res.ok ? "success" : "error");
                        })
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="تفعيل"
                      className={p.isAvailable ? "text-emerald-600" : "text-gray-400"}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await toggleProductAvailabilityAction(p.id, !p.isAvailable);
                          toast.push(res.ok ? "تحدثات الحالة" : res.error, res.ok ? "success" : "error");
                        })
                      }
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-600"
                      aria-label="حذف"
                      onClick={() => {
                        if (!confirm(`متأكد باغي تحيد ${p.name}؟`)) return;
                        startTransition(async () => {
                          const res = await deleteProductAction(p.id);
                          toast.push(res.ok ? "تحيد المنتج" : res.error, res.ok ? "success" : "error");
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
