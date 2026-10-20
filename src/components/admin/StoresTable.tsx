"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import { Button, Card, Select } from "@/components/ui";
import { useToast } from "@/components/providers";
import { deleteStoreAction, setStoreStatusAction, toggleStoreOpenAction } from "@/lib/actions/admin";
import { money } from "@/lib/utils";

export type StoreRow = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string;
  kind: string;
  status: string;
  isOpen: boolean;
  deliveryFee: number;
  minOrder: number;
  commissionRate: number;
  rating: number;
  orderCount: number;
  categoryName: string | null;
};

export function StoresTable({ stores }: { stores: StoreRow[] }) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const list = stores.filter((s) => s.name.includes(query) || s.city.includes(query));

  return (
    <Card className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="قلب على محل..."
        className="h-11 w-full max-w-xs rounded-2xl border border-gray-200 px-4 text-sm outline-none focus:border-[#FF6B35]"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="pb-2 font-bold">المحل</th>
              <th className="pb-2 font-bold">التصنيف</th>
              <th className="pb-2 font-bold">المدينة</th>
              <th className="pb-2 font-bold">التوصيل</th>
              <th className="pb-2 font-bold">العمولة</th>
              <th className="pb-2 font-bold">الطلبات</th>
              <th className="pb-2 font-bold">الحالة</th>
              <th className="pb-2 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {list.map((store) => (
              <tr key={store.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {store.logoUrl ? (
                      <Image src={store.logoUrl} alt={store.name} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                    ) : null}
                    <div>
                      <Link href={`/store/${store.slug}`} className="font-extrabold text-[#111827] hover:text-[#FF6B35]">
                        {store.name}
                      </Link>
                      <p className="text-[11px] text-gray-400">{store.kind === "store" ? "متجر" : "مطعم"}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-gray-600">{store.categoryName ?? "—"}</td>
                <td className="py-3 text-gray-600">{store.city}</td>
                <td className="py-3 text-gray-600">{money(store.deliveryFee)}</td>
                <td className="py-3 text-gray-600">{store.commissionRate}%</td>
                <td className="py-3 text-gray-600">{store.orderCount}</td>
                <td className="py-3">
                  <Select
                    className="h-9 w-32 text-xs"
                    value={store.status}
                    disabled={pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        const res = await setStoreStatusAction(store.id, e.target.value as "approved");
                        toast.push(res.ok ? "تحدثات الحالة" : res.error, res.ok ? "success" : "error");
                      })
                    }
                  >
                    <option value="approved">منشور</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="suspended">موقوف</option>
                  </Select>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/stores/${store.id}`}>
                      <Button size="icon" variant="ghost" aria-label="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="فتح/إغلاق"
                      className={store.isOpen ? "text-emerald-600" : "text-gray-400"}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await toggleStoreOpenAction(store.id, !store.isOpen);
                          toast.push(res.ok ? (store.isOpen ? "تسد المحل" : "تحل المحل") : res.error, res.ok ? "success" : "error");
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
                        if (!confirm(`متأكد باغي تحيد ${store.name}؟`)) return;
                        startTransition(async () => {
                          const res = await deleteStoreAction(store.id);
                          toast.push(res.ok ? "تحيد المحل" : res.error, res.ok ? "success" : "error");
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
