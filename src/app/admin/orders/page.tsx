import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { LiveOrderRefresh } from "@/components/order/OrderTracker";
import { listAllOrders, listDrivers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, drivers] = await Promise.all([listAllOrders({ limit: 100 }), listDrivers()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">الطلبات</h1>
          <p className="text-sm text-gray-500">تتبع وحدّث حالة كل الطلبات مباشرة</p>
        </div>
        <LiveOrderRefresh />
      </div>

      <OrdersBoard
        role="admin"
        drivers={drivers.map((d) => ({ id: d.id, name: d.name, status: d.status }))}
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
    </div>
  );
}
