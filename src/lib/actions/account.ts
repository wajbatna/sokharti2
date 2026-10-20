"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses, favorites, notifications, reviews, stores, users } from "@/db/schema";
import { getCurrentUser, hashPassword, requireUser } from "@/lib/auth";
import type { Result } from "@/lib/utils";

export async function saveAddressAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "المرجو تسجيل الدخول أولاً" };

  const id = Number(formData.get("id") ?? 0);
  const payload = {
    userId: user.id,
    label: String(formData.get("label") ?? "home"),
    city: String(formData.get("city") ?? "برشيد"),
    street: String(formData.get("street") ?? ""),
    details: String(formData.get("details") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
  };
  if (payload.street.length < 5) return { ok: false, error: "المرجو إدخال عنوان مفصل" };

  if (payload.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }
  if (id) {
    await db.update(addresses).set(payload).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  } else {
    await db.insert(addresses).values(payload);
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteAddressAction(id: number): Promise<Result> {
  const user = await requireUser();
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddressAction(id: number): Promise<Result> {
  const user = await requireUser();
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  await db.update(addresses).set({ isDefault: true }).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function toggleFavoriteAction(input: { storeId?: number; productId?: number }): Promise<Result<{ active: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "سجل الدخول باش تحتافظ بالمفضلة" };

  const condition = input.storeId
    ? and(eq(favorites.userId, user.id), eq(favorites.storeId, input.storeId))
    : and(eq(favorites.userId, user.id), eq(favorites.productId, input.productId!));
  const existing = await db.select().from(favorites).where(condition).limit(1);
  if (existing.length) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    revalidatePath("/account/favorites");
    return { ok: true, data: { active: false } };
  }
  await db.insert(favorites).values({ userId: user.id, storeId: input.storeId ?? null, productId: input.productId ?? null });
  revalidatePath("/account/favorites");
  return { ok: true, data: { active: true } };
}

export async function updateProfileAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 3) return { ok: false, error: "الاسم قصير جداً" };

  const patch: Record<string, unknown> = { name, phone, city };
  if (password) {
    if (password.length < 8) return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
    patch.passwordHash = await hashPassword(password);
  }
  await db.update(users).set(patch).where(eq(users.id, user.id));
  revalidatePath("/account");
  return { ok: true };
}

export async function markNotificationsReadAction(): Promise<Result> {
  const user = await requireUser();
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function submitReviewAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "سجل الدخول باش تقيّم" };
  const storeId = Number(formData.get("storeId"));
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5)));
  const deliveryRating = Math.min(5, Math.max(1, Number(formData.get("deliveryRating") ?? rating)));
  const productRating = Math.min(5, Math.max(1, Number(formData.get("productRating") ?? rating)));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!storeId) return { ok: false, error: "محل غير صالح" };

  await db.insert(reviews).values({
    userId: user.id,
    storeId,
    orderId: formData.get("orderId") ? Number(formData.get("orderId")) : null,
    authorName: user.name,
    rating,
    deliveryRating,
    productRating,
    comment,
    status: "pending",
  });
  await db
    .update(stores)
    .set({ reviewCount: sql`${stores.reviewCount} + 1` })
    .where(eq(stores.id, storeId));
  revalidatePath("/account/orders");
  return { ok: true };
}
