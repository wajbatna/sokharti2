import Link from "next/link";
import { BadgeDollarSign, Package, ShoppingBag, Star } from "lucide-react";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { LiveOrderRefresh } from "@/components/order/OrderTracker";
import { Card, EmptyState, StatCard } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getVendorStats, getVendorStore, listAllOrders } from "@/lib/queries";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorDashboard() {
  const user = await getCurrentUser();
  const store = user ? await getVendorStore(user.id) : null;

  if (!store) {
    return (
      <EmptyState
        icon={<Package className="h-7 w-7" />}
        title="ما عندك حتى محل مرتبط بحسابك"
        description="تواصل مع إدارة سخرتي باش يربطو محلك بهاد الحساب."
      />
    );
  }

  const [stats, orders] = await Promise.all([getVendorStats(store.id), listAllOrders({ storeId: store.id, limit: 60 })]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">{store.name}</h1>
          <p className="text-sm text-gray-500">
            {store.isOpen ? "المحل مفتوح دابا" : "المحل مغلق"} ·{" "}
            <Link href={`/store/${store.slug}`} className="font-bold text-[#FF6B35] hover:underline">
              شوف صفحة المحل
            </Link>
          </p>
        </div>
        <LiveOrderRefresh />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="مداخيلي" value={money(stats.revenue)} hint="بعد خصم العمولة" icon={<BadgeDollarSign className="h-5 w-5" />} />
        <StatCard label="الطلبات" value={String(stats.orders)} icon={<ShoppingBag className="h-5 w-5" />} tone="dark" />
        <StatCard label="المنتجات" value={String(stats.products)} icon={<Package className="h-5 w-5" />} tone="blue" />
        <StatCard label="التقييم" value={stats.rating ? stats.rating.toFixed(1) : "—"} hint={`${stats.reviews} تقييم`} icon={<Star className="h-5 w-5" />} tone="green" />
      </div>

      <Card>
        <h2 className="mb-4 text-base font-extrabold text-[#111827]">طلبات محلي</h2>
        <OrdersBoard
          role="vendor"
          orders={orders.map((o) => ({
            id: o.id,
            code: o.code,
            status: o.status,
            total: o.total,
            subtotal: o.subtotal,
            commission: o.commission,
            vendorEarnings: o.vendorEarnings,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            contactName: o.contactName,
            phone: o.phone,
            addressText: o.addressText,
            createdAt: o.createdAt.toISOString(),
            storeName: o.store.name,
            driverId: o.driverId,
            items: o.items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, lineTotal: i.lineTotal })),
          }))}
        />
      </Card>
    </div>
  );
}
