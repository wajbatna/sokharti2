import Link from "next/link";
import { BadgeDollarSign, Bike, Package, ShoppingBag, Star, Store, TrendingUp, Users } from "lucide-react";
import { Card, StatCard } from "@/components/ui";
import { getAdminStats, listAllOrders } from "@/lib/queries";
import { STATUS_COLOR, STATUS_LABEL, formatDateAr, money } from "@/lib/utils";
import { LiveOrderRefresh } from "@/components/order/OrderTracker";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, orders] = await Promise.all([getAdminStats(), listAllOrders({ limit: 8 })]);
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.total));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">نظرة عامة</h1>
          <p className="text-sm text-gray-500">إحصائيات المنصة فالوقت الحقيقي</p>
        </div>
        <LiveOrderRefresh />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المبيعات" value={money(stats.revenue)} hint={`${stats.orderCount} طلب`} icon={<BadgeDollarSign className="h-5 w-5" />} />
        <StatCard label="أرباح المنصة" value={money(stats.platformRevenue)} hint="عمولات + رسوم الخدمة" icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="متوسط قيمة الطلب" value={money(stats.avgOrder)} icon={<ShoppingBag className="h-5 w-5" />} tone="blue" />
        <StatCard label="المستخدمون" value={String(stats.users)} hint={`${stats.drivers} سائق`} icon={<Users className="h-5 w-5" />} tone="dark" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المحلات" value={String(stats.stores)} icon={<Store className="h-5 w-5" />} />
        <StatCard label="المنتجات" value={String(stats.products)} icon={<Package className="h-5 w-5" />} tone="dark" />
        <StatCard label="السائقون" value={String(stats.drivers)} icon={<Bike className="h-5 w-5" />} tone="blue" />
        <StatCard label="تقييمات بانتظار المراجعة" value={String(stats.pendingReviews)} icon={<Star className="h-5 w-5" />} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="mb-4 text-base font-extrabold text-[#111827]">المبيعات اليومية</h2>
          <div className="flex h-48 items-end gap-2">
            {stats.daily.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#FF6B35] to-[#ffa07a] transition-all"
                  style={{ height: `${Math.max(6, (d.total / maxDaily) * 100)}%` }}
                  title={`${money(d.total)} — ${d.count} طلب`}
                />
                <span className="text-[9px] font-bold text-gray-400">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-extrabold text-[#111827]">أفضل المحلات</h2>
          <ul className="space-y-3">
            {stats.topStores.map((s, i) => (
              <li key={s.slug} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EB] text-xs font-extrabold text-[#E4551F]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#111827]">{s.name}</p>
                  <p className="text-[11px] text-gray-500">{s.count} طلب</p>
                </div>
                <span className="text-sm font-extrabold text-[#111827]">{money(s.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#111827]">آخر الطلبات</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-[#FF6B35] hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="pb-2 font-bold">رقم الطلب</th>
                <th className="pb-2 font-bold">المحل</th>
                <th className="pb-2 font-bold">الزبون</th>
                <th className="pb-2 font-bold">المبلغ</th>
                <th className="pb-2 font-bold">الحالة</th>
                <th className="pb-2 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3">
                    <Link href={`/orders/${o.code}`} className="font-extrabold text-[#111827] hover:text-[#FF6B35]">
                      #{o.code}
                    </Link>
                  </td>
                  <td className="py-3 text-gray-600">{o.store.name}</td>
                  <td className="py-3 text-gray-600">{o.contactName}</td>
                  <td className="py-3 font-bold">{money(o.total)}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="py-3 text-xs text-gray-400">{formatDateAr(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
