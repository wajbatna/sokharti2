"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  couponUsage,
  coupons,
  deliveries,
  drivers,
  notifications,
  orderEvents,
  orderItemExtras,
  orderItems,
  orders,
  payments,
  productExtras,
  products,
  stores,
  users,
} from "@/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { gatewayFor, type PaymentMethod } from "@/lib/payments";
import { publish } from "@/lib/realtime";
import { ORDER_FLOW, SERVICE_FEE_CENTS, orderCode, type Result } from "@/lib/utils";

export type CartLineInput = {
  productId: number;
  quantity: number;
  notes?: string;
  extraIds: number[];
};

export type PlaceOrderInput = {
  storeId: number;
  lines: CartLineInput[];
  contactName: string;
  phone: string;
  addressText: string;
  addressLabel?: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string;
  couponCode?: string;
  paymentMethod: PaymentMethod;
};

/** Server-side re-pricing: the client never dictates money values. */
async function priceCart(storeId: number, lines: CartLineInput[]) {
  const ids = lines.map((l) => l.productId);
  if (!ids.length) throw new Error("السلة فارغة");
  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.storeId, storeId)));
  const extras = await db.select().from(productExtras).where(inArray(productExtras.productId, ids));

  const priced = lines.map((line) => {
    const product = rows.find((p) => p.id === line.productId);
    if (!product) throw new Error("منتج غير متوفر");
    if (!product.isAvailable) throw new Error(`${product.name} غير متوفر حالياً`);
    const lineExtras = extras.filter((e) => e.productId === product.id && line.extraIds.includes(e.id));
    const unitPrice = product.price + lineExtras.reduce((s, e) => s + e.price, 0);
    const quantity = Math.max(1, Math.min(30, line.quantity));
    return {
      product,
      extras: lineExtras,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      notes: line.notes?.slice(0, 200) ?? null,
    };
  });
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0);
  return { priced, subtotal };
}

export async function validateCouponAction(input: { code: string; storeId: number; subtotal: number }): Promise<
  Result<{ code: string; discount: number; freeDelivery: boolean; label: string }>
> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "أدخل كود الخصم" };
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  if (!coupon || !coupon.isActive) return { ok: false, error: "كود غير صالح" };
  if (coupon.endsAt && coupon.endsAt < new Date()) return { ok: false, error: "انتهت صلاحية الكود" };
  if (coupon.storeId && coupon.storeId !== input.storeId) return { ok: false, error: "هذا الكود خاص بمحل آخر" };
  if (input.subtotal < coupon.minOrder)
    return { ok: false, error: `الحد الأدنى للطلب ${(coupon.minOrder / 100).toFixed(0)} د.م` };
  if (coupon.usedCount >= coupon.usageLimit) return { ok: false, error: "استُنفد هذا الكود" };

  const user = await getCurrentUser();
  if (user) {
    const used = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(couponUsage)
      .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, user.id)));
    if (used[0].c >= coupon.perUserLimit) return { ok: false, error: "استعملتي هاد الكود من قبل" };
  }

  let discount = 0;
  let freeDelivery = false;
  if (coupon.type === "percent") {
    discount = Math.round((input.subtotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "fixed") {
    discount = Math.min(coupon.value, input.subtotal);
  } else {
    freeDelivery = true;
  }
  return { ok: true, data: { code, discount, freeDelivery, label: coupon.description ?? code } };
}

export async function placeOrderAction(input: PlaceOrderInput): Promise<Result<{ code: string }>> {
  try {
    const user = await getCurrentUser();
    const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
    if (!store) return { ok: false, error: "المحل غير موجود" };
    if (!store.isOpen) return { ok: false, error: "المحل مغلق حالياً" };

    const { priced, subtotal } = await priceCart(store.id, input.lines);
    if (subtotal < store.minOrder)
      return { ok: false, error: `الحد الأدنى للطلب ${(store.minOrder / 100).toFixed(0)} د.م` };

    let discount = 0;
    let deliveryFee = store.deliveryFee;
    let couponId: number | null = null;
    if (input.couponCode) {
      const res = await validateCouponAction({ code: input.couponCode, storeId: store.id, subtotal });
      if (res.ok && res.data) {
        discount = res.data.discount;
        if (res.data.freeDelivery) deliveryFee = 0;
        const [c] = await db.select().from(coupons).where(eq(coupons.code, res.data.code)).limit(1);
        couponId = c?.id ?? null;
      }
    }

    const serviceFee = SERVICE_FEE_CENTS;
    const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);
    const commission = Math.round((subtotal * store.commissionRate) / 100);

    const code = orderCode();
    const [order] = await db
      .insert(orders)
      .values({
        code,
        userId: user?.id ?? null,
        storeId: store.id,
        status: "received",
        subtotal,
        deliveryFee,
        serviceFee,
        discount,
        total,
        commission,
        vendorEarnings: subtotal - commission,
        platformRevenue: commission + serviceFee,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        contactName: input.contactName.slice(0, 80),
        phone: input.phone.slice(0, 20),
        addressLabel: input.addressLabel ?? "home",
        addressText: input.addressText.slice(0, 240),
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        notes: input.notes?.slice(0, 300) ?? null,
        couponCode: discount || deliveryFee === 0 ? input.couponCode ?? null : null,
        etaMinutes: store.deliveryMaxMinutes,
      })
      .returning();

    for (const line of priced) {
      const [item] = await db
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: line.product.id,
          name: line.product.name,
          imageUrl: line.product.imageUrl,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          notes: line.notes,
          lineTotal: line.lineTotal,
        })
        .returning();
      if (line.extras.length) {
        await db.insert(orderItemExtras).values(line.extras.map((e) => ({ orderItemId: item.id, name: e.name, price: e.price })));
      }
    }

    await db.insert(orderEvents).values({ orderId: order.id, status: "received", message: "توصلنا بطلبك" });

    const gateway = gatewayFor(input.paymentMethod);
    const charge = await gateway.charge({
      orderCode: code,
      amount: total,
      method: input.paymentMethod,
      customer: { name: input.contactName, phone: input.phone },
    });
    await db.insert(payments).values({
      orderId: order.id,
      provider: charge.provider,
      method: input.paymentMethod,
      amount: total,
      status: charge.status,
      reference: charge.reference,
    });
    if (charge.status === "paid") {
      await db.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, order.id));
    }

    if (couponId) {
      await db.insert(couponUsage).values({ couponId, userId: user?.id ?? null, orderId: order.id, discount });
      await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, couponId));
    }

    await db.update(stores).set({ orderCount: sql`${stores.orderCount} + 1` }).where(eq(stores.id, store.id));

    const targets: { userId: number | null; audience: string; title: string; body: string; link: string }[] = [];
    if (user) targets.push({ userId: user.id, audience: "customer", title: "توصلنا بطلبك 🎉", body: `الطلب ${code} من ${store.name}`, link: `/orders/${code}` });
    if (store.ownerId) targets.push({ userId: store.ownerId, audience: "vendor", title: "طلب جديد 🛎️", body: `طلب جديد ${code}`, link: "/vendor" });
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    admins.forEach((a) => targets.push({ userId: a.id, audience: "admin", title: "طلب جديد على المنصة", body: `${store.name} — ${code}`, link: "/admin/orders" }));
    if (targets.length) await db.insert(notifications).values(targets.map((t) => ({ ...t, type: "order" })));

    await publish({ type: "order.created", orderCode: code, orderId: order.id, storeId: store.id, status: "received" });

    revalidatePath("/admin/orders");
    revalidatePath("/vendor");
    return { ok: true, data: { code } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إنشاء الطلب";
    return { ok: false, error: message };
  }
}

const FLOW: readonly string[] = ORDER_FLOW;

export async function updateOrderStatusAction(orderId: number, status: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "الطلب غير موجود" };

  if (user.role === "vendor") {
    const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
    if (!store || store.ownerId !== user.id) return { ok: false, error: "غير مصرح لك بهذا الطلب" };
    if (!["confirmed", "preparing", "ready", "cancelled"].includes(status))
      return { ok: false, error: "حالة غير مسموحة للتاجر" };
  } else if (user.role === "driver") {
    if (!["picked_up", "on_the_way", "delivered"].includes(status)) return { ok: false, error: "حالة غير مسموحة للسائق" };
  } else if (user.role !== "admin") {
    return { ok: false, error: "غير مصرح" };
  }

  if (!FLOW.includes(status) && status !== "cancelled") return { ok: false, error: "حالة غير معروفة" };

  await db
    .update(orders)
    .set({
      status: status as "received",
      updatedAt: new Date(),
      paymentStatus: status === "delivered" && order.paymentMethod === "cash" ? "paid" : order.paymentStatus,
    })
    .where(eq(orders.id, orderId));
  await db.insert(orderEvents).values({ orderId, status: status as "received" });

  if (status === "delivered") {
    await db.update(payments).set({ status: "paid" }).where(eq(payments.orderId, orderId));
    if (order.driverId) {
      await db
        .update(drivers)
        .set({ deliveriesCount: sql`${drivers.deliveriesCount} + 1`, earnings: sql`${drivers.earnings} + ${order.deliveryFee}`, status: "available" })
        .where(eq(drivers.id, order.driverId));
      await db.update(deliveries).set({ status: "delivered", deliveredAt: new Date() }).where(eq(deliveries.orderId, orderId));
    }
  }

  if (order.userId) {
    await db.insert(notifications).values({
      userId: order.userId,
      audience: "customer",
      title: "تحديث على طلبك",
      body: `الطلب ${order.code}: ${status}`,
      type: "order",
      link: `/orders/${order.code}`,
    });
  }

  await publish({ type: "order.updated", orderCode: order.code, orderId, storeId: order.storeId, status });
  revalidatePath(`/orders/${order.code}`);
  revalidatePath("/admin/orders");
  revalidatePath("/vendor");
  revalidatePath("/driver");
  return { ok: true };
}

export async function cancelOrderAction(orderId: number): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  if (user.role === "customer" && order.userId !== user.id) return { ok: false, error: "غير مصرح" };
  if (["picked_up", "on_the_way", "delivered"].includes(order.status))
    return { ok: false, error: "ما يمكنش تلغي الطلب فهاد المرحلة" };

  await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, orderId));
  await db.insert(orderEvents).values({ orderId, status: "cancelled", message: "تم إلغاء الطلب" });
  await publish({ type: "order.updated", orderCode: order.code, orderId, storeId: order.storeId, status: "cancelled" });
  revalidatePath("/account/orders");
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function assignDriverAction(orderId: number, driverId: number): Promise<Result> {
  await requireRole("admin", "driver");
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  await db.update(orders).set({ driverId, updatedAt: new Date() }).where(eq(orders.id, orderId));
  await db.update(drivers).set({ status: "busy" }).where(eq(drivers.id, driverId));
  const existing = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId)).limit(1);
  if (existing.length) {
    await db.update(deliveries).set({ driverId, status: "assigned" }).where(eq(deliveries.id, existing[0].id));
  } else {
    await db.insert(deliveries).values({ orderId, driverId, status: "assigned", fee: order.deliveryFee });
  }
  await publish({ type: "order.updated", orderCode: order.code, orderId, storeId: order.storeId, status: order.status });
  revalidatePath("/admin/orders");
  revalidatePath("/driver");
  return { ok: true };
}
