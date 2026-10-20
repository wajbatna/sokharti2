"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bike, MapPin, Package, Phone } from "lucide-react";
import { Button, Card, EmptyState, Select, StatCard, Tabs } from "@/components/ui";
import { useOrderStream } from "@/components/order/OrderTracker";
import { useToast } from "@/components/providers";
import { assignDriverAction, updateOrderStatusAction } from "@/lib/actions/orders";
import { setDriverStatusAction } from "@/lib/actions/admin";
import { STATUS_COLOR, STATUS_LABEL, formatDateAr, money } from "@/lib/utils";
import { useState } from "react";

export type DriverOrder = {
  id: number;
  code: string;
  status: string;
  total: number;
  deliveryFee: number;
  addressText: string;
  contactName: string;
  phone: string;
  storeName: string;
  createdAt: string;
  driverId: number | null;
};

export function DriverConsole({
  driver,
  orders,
}: {
  driver: { id: number; name: string; status: string; rating: number; deliveriesCount: number; earnings: number; vehicle: string };
  orders: DriverOrder[];
}) {
  const [tab, setTab] = useState("available");
  const [pending, start] = useTransition();
  const toast = useToast();
  useOrderStream(undefined);

  const available = orders.filter((o) => !o.driverId && ["confirmed", "preparing", "ready"].includes(o.status));
  const current = orders.filter((o) => o.driverId === driver.id && !["delivered", "cancelled"].includes(o.status));
  const history = orders.filter((o) => o.driverId === driver.id && ["delivered", "cancelled"].includes(o.status));
  const list = tab === "available" ? available : tab === "current" ? current : history;

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      toast.push(res.ok ? success : res.error ?? "خطأ", res.ok ? "success" : "error");
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">مرحباً {driver.name}</h1>
          <p className="text-sm text-gray-500">{driver.vehicle} · ⭐ {driver.rating.toFixed(1)}</p>
        </div>
        <Select
          className="h-11 w-44"
          value={driver.status}
          onChange={(e) => act(() => setDriverStatusAction(driver.id, e.target.value as "available"), "تحدثات حالتك")}
        >
          <option value="available">متاح للعمل</option>
          <option value="busy">مشغول</option>
          <option value="offline">غير متصل</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="أرباحي" value={money(driver.earnings)} icon={<Bike className="h-5 w-5" />} />
        <StatCard label="التوصيلات" value={String(driver.deliveriesCount)} icon={<Package className="h-5 w-5" />} tone="dark" />
        <StatCard label="طلبات متاحة" value={String(available.length)} icon={<MapPin className="h-5 w-5" />} tone="green" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "available", label: "طلبات متاحة", count: available.length },
          { id: "current", label: "التوصيل الحالي", count: current.length },
          { id: "history", label: "السجل", count: history.length },
        ]}
      />

      {!list.length ? (
        <EmptyState icon={<Bike className="h-7 w-7" />} title="ما كاين حتى طلب" description="غادي تبان الطلبات هنا مباشرة ملي تكون جاهزة." />
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
                  <p className="mt-1 text-xs text-gray-500">{order.storeName} → {order.addressText}</p>
                  <p className="text-[11px] text-gray-400">{formatDateAr(order.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p className="text-base font-extrabold text-[#111827]">{money(order.total)}</p>
                  <p className="text-[11px] text-emerald-600">أجرة التوصيل {money(order.deliveryFee)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!order.driverId ? (
                  <Button size="sm" disabled={pending} onClick={() => act(() => assignDriverAction(order.id, driver.id), "قبلتي الطلب")}>
                    قبول الطلب
                  </Button>
                ) : null}
                {order.driverId === driver.id && order.status !== "delivered" ? (
                  <>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => updateOrderStatusAction(order.id, "picked_up"), "توصلتي بالطلب")}>
                      استلمت الطلب
                    </Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => updateOrderStatusAction(order.id, "on_the_way"), "فالطريق")}>
                      فالطريق
                    </Button>
                    <Button size="sm" disabled={pending} onClick={() => act(() => updateOrderStatusAction(order.id, "delivered"), "تم التوصيل ✓")}>
                      تم التوصيل
                    </Button>
                  </>
                ) : null}
                <a href={`tel:${order.phone}`}>
                  <Button size="sm" variant="ghost">
                    <Phone className="h-3.5 w-3.5" /> {order.contactName}
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
