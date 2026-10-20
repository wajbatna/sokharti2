"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronDown, Truck } from "lucide-react";
import { Button, Card, EmptyState, Select, Tabs } from "@/components/ui";
import { useOrderStream } from "@/components/order/OrderTracker";
import { useToast } from "@/components/providers";
import { assignDriverAction, updateOrderStatusAction } from "@/lib/actions/orders";
import { ORDER_FLOW, STATUS_COLOR, STATUS_LABEL, formatDateAr, money } from "@/lib/utils";

export type BoardOrder = {
  id: number;
  code: string;
  status: string;
  total: number;
  subtotal: number;
  commission: number;
  vendorEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  contactName: string;
  phone: string;
  addressText: string;
  createdAt: string;
  storeName: string;
  driverId: number | null;
  items: { id: number; name: string; quantity: number; lineTotal: number }[];
};

const TABS = [
  { id: "all", label: "الكل" },
  { id: "received", label: "جديدة" },
  { id: "confirmed", label: "مؤكدة" },
  { id: "preparing", label: "قيد التحضير" },
  { id: "ready", label: "جاهزة" },
  { id: "on_the_way", label: "فالطريق" },
  { id: "delivered", label: "موصلة" },
  { id: "cancelled", label: "ملغاة" },
];

export function OrdersBoard({
  orders,
  drivers = [],
  role = "admin",
}: {
  orders: BoardOrder[];
  drivers?: { id: number; name: string; status: string }[];
  role?: "admin" | "vendor";
}) {
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  useOrderStream(undefined);

  const allowed = role === "vendor" ? ["confirmed", "preparing", "ready", "cancelled"] : [...ORDER_FLOW, "cancelled"];
  const list = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  const setStatus = (order: BoardOrder, status: string) =>
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, status);
      toast.push(res.ok ? `تحدثات حالة ${order.code}` : res.error, res.ok ? "success" : "error");
    });

  return (
    <div className="space-y-4">
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({ ...t, count: t.id === "all" ? orders.length : orders.filter((o) => o.status === t.id).length }))}
      />

      {!list.length ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="ما كاين حتى طلب فهاد الحالة" description="الطلبات الجديدة كتبان هنا مباشرة." />
      ) : (
        <div className="space-y-3">
          {list.map((order) => (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/orders/${order.code}`} className="text-sm font-extrabold text-[#111827] hover:text-[#FF6B35]">
                      #{order.code}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.storeName} · {order.contactName} · {order.phone}
                  </p>
                  <p className="text-[11px] text-gray-400">{formatDateAr(order.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p className="text-base font-extrabold text-[#111827]">{money(order.total)}</p>
                  <p className="text-[11px] text-gray-500">
                    {order.paymentMethod === "cash" ? "عند الاستلام" : "أونلاين"} · {order.paymentStatus === "paid" ? "مؤدى" : "غير مؤدى"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="flex items-center gap-1 text-xs font-bold text-[#FF6B35]"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition ${expanded === order.id ? "rotate-180" : ""}`} />
                تفاصيل الطلب ({order.items.length} منتج)
              </button>

              {expanded === order.id ? (
                <div className="space-y-2 rounded-2xl bg-gray-50 p-3 text-xs">
                  <ul className="space-y-1">
                    {order.items.map((i) => (
                      <li key={i.id} className="flex justify-between">
                        <span className="text-gray-600">
                          {i.quantity}× {i.name}
                        </span>
                        <span className="font-bold">{money(i.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-500">العنوان: {order.addressText}</p>
                  {role === "admin" ? (
                    <p className="text-gray-500">
                      العمولة: <span className="font-bold text-[#111827]">{money(order.commission)}</span> · أرباح التاجر:{" "}
                      <span className="font-bold text-[#111827]">{money(order.vendorEarnings)}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {allowed.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={order.status === status ? "primary" : "outline"}
                    disabled={pending || order.status === status}
                    onClick={() => setStatus(order, status)}
                  >
                    {STATUS_LABEL[status]}
                  </Button>
                ))}

                {role === "admin" && drivers.length ? (
                  <Select
                    className="h-9 w-44 text-xs"
                    value={order.driverId ?? ""}
                    onChange={(e) =>
                      startTransition(async () => {
                        const res = await assignDriverAction(order.id, Number(e.target.value));
                        toast.push(res.ok ? "تعين السائق" : res.error, res.ok ? "success" : "error");
                      })
                    }
                  >
                    <option value="">تعيين سائق</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status === "available" ? "متاح" : d.status === "busy" ? "مشغول" : "غير متصل"})
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
