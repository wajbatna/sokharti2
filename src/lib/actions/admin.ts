"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  banners,
  categories,
  coupons,
  drivers,
  media,
  menuSections,
  offers,
  productExtras,
  products,
  reviews,
  settings,
  storeHours,
  stores,
  users,
} from "@/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { slugify, toCents, type Result } from "@/lib/utils";

const num = (fd: FormData, key: string, fallback = 0) => {
  const raw = fd.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};
const str = (fd: FormData, key: string, fallback = "") => String(fd.get(key) ?? fallback).trim();
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

async function assertStoreAccess(storeId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role === "admin") return user;
  if (user.role === "vendor") {
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (store?.ownerId === user.id) return user;
  }
  throw new Error("FORBIDDEN");
}

/* ------------------------------- MEDIA ---------------------------------- */

export async function uploadMediaAction(formData: FormData): Promise<Result<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user || !["admin", "vendor"].includes(user.role)) return { ok: false, error: "غير مصرح بالرفع" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "المرجو اختيار صورة" };
  if (file.size > 6 * 1024 * 1024) return { ok: false, error: "حجم الصورة كبير (الحد 6 ميغا)" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "الملف ليس صورة" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({
      filename: file.name.slice(0, 120),
      mimeType: file.type,
      size: buffer.byteLength,
      data: buffer.toString("base64"),
      uploadedBy: user.id,
    })
    .returning({ id: media.id });
  return { ok: true, data: { url: `/api/media/${row.id}` } };
}

/* ------------------------------- STORES --------------------------------- */

export async function saveStoreAction(
  _prev: Result<{ id: number }> | null,
  formData: FormData,
): Promise<Result<{ id: number }>> {
  const id = num(formData, "id");
  if (id) await assertStoreAccess(id);
  else await requireRole("admin");

  const name = str(formData, "name");
  if (name.length < 2) return { ok: false, error: "اسم المحل مطلوب" };
  const nameEn = str(formData, "nameEn") || name;
  const slugBase = slugify(nameEn) || `store-${Date.now()}`;

  const payload = {
    name,
    nameEn,
    description: str(formData, "description"),
    logoUrl: str(formData, "logoUrl") || null,
    coverUrl: str(formData, "coverUrl") || null,
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    city: str(formData, "city", "برشيد"),
    lat: num(formData, "lat", 33.2667),
    lng: num(formData, "lng", -7.5869),
    categoryId: num(formData, "categoryId") || null,
    kind: (str(formData, "kind", "restaurant") === "store" ? "store" : "restaurant") as "store" | "restaurant",
    deliveryFee: toCents(num(formData, "deliveryFee", 10)),
    minOrder: toCents(num(formData, "minOrder", 50)),
    deliveryRadiusKm: num(formData, "deliveryRadiusKm", 8),
    deliveryMinMinutes: num(formData, "deliveryMinMinutes", 25),
    deliveryMaxMinutes: num(formData, "deliveryMaxMinutes", 40),
    commissionRate: num(formData, "commissionRate", 10),
    status: (str(formData, "status", "approved") as "approved" | "pending" | "suspended") ?? "approved",
    isOpen: bool(formData, "isOpen"),
    isFeatured: bool(formData, "isFeatured"),
    isNew: bool(formData, "isNew"),
    freeDelivery: bool(formData, "freeDelivery"),
    discountLabel: str(formData, "discountLabel") || null,
    ownerId: num(formData, "ownerId") || null,
  };

  let storeId = id;
  if (id) {
    await db.update(stores).set(payload).where(eq(stores.id, id));
  } else {
    const [row] = await db
      .insert(stores)
      .values({ ...payload, slug: `${slugBase}-${Math.floor(Math.random() * 900 + 100)}` })
      .returning();
    storeId = row.id;
    await db.insert(menuSections).values(
      (payload.kind === "restaurant"
        ? ["الأكثر طلباً", "الأطباق الرئيسية", "المشروبات والحلويات"]
        : ["الأكثر مبيعاً", "عروض الأسبوع", "أساسيات البيت"]
      ).map((n, i) => ({ storeId: row.id, name: n, sortOrder: i })),
    );
  }

  // opening hours (7 rows)
  for (let day = 0; day < 7; day += 1) {
    const open = str(formData, `open_${day}`, "09:00");
    const close = str(formData, `close_${day}`, "23:30");
    const closed = bool(formData, `closed_${day}`);
    const existing = await db
      .select()
      .from(storeHours)
      .where(and(eq(storeHours.storeId, storeId), eq(storeHours.dayOfWeek, day)))
      .limit(1);
    if (existing.length) {
      await db.update(storeHours).set({ openTime: open, closeTime: close, isClosed: closed }).where(eq(storeHours.id, existing[0].id));
    } else {
      await db.insert(storeHours).values({ storeId, dayOfWeek: day, openTime: open, closeTime: close, isClosed: closed });
    }
  }

  revalidatePath("/admin/stores");
  revalidatePath("/restaurants");
  revalidatePath("/stores");
  revalidatePath("/");
  return { ok: true, data: { id: storeId } };
}

export async function deleteStoreAction(id: number): Promise<Result> {
  await requireRole("admin");
  await db.delete(stores).where(eq(stores.id, id));
  revalidatePath("/admin/stores");
  revalidatePath("/");
  return { ok: true };
}

export async function setStoreStatusAction(id: number, status: "approved" | "pending" | "suspended"): Promise<Result> {
  await requireRole("admin");
  await db.update(stores).set({ status }).where(eq(stores.id, id));
  revalidatePath("/admin/stores");
  return { ok: true };
}

export async function toggleStoreOpenAction(id: number, isOpen: boolean): Promise<Result> {
  await assertStoreAccess(id);
  await db.update(stores).set({ isOpen }).where(eq(stores.id, id));
  revalidatePath("/admin/stores");
  revalidatePath("/vendor");
  return { ok: true };
}

/* ------------------------------ PRODUCTS -------------------------------- */

export async function saveProductAction(
  _prev: Result<{ id: number }> | null,
  formData: FormData,
): Promise<Result<{ id: number }>> {
  const storeId = num(formData, "storeId");
  if (!storeId) return { ok: false, error: "اختر المحل" };
  await assertStoreAccess(storeId);

  const id = num(formData, "id");
  const name = str(formData, "name");
  if (name.length < 2) return { ok: false, error: "اسم المنتج مطلوب" };
  const price = toCents(num(formData, "price", 0));
  if (price <= 0) return { ok: false, error: "الثمن غير صحيح" };
  const oldPriceRaw = num(formData, "oldPrice", 0);
  const oldPrice = oldPriceRaw > 0 ? toCents(oldPriceRaw) : null;

  const payload = {
    storeId,
    sectionId: num(formData, "sectionId") || null,
    name,
    description: str(formData, "description"),
    imageUrl: str(formData, "imageUrl") || null,
    price,
    oldPrice,
    discountPercent: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
    isPopular: bool(formData, "isPopular"),
    isAvailable: bool(formData, "isAvailable"),
    stock: num(formData, "stock", 50),
    sortOrder: num(formData, "sortOrder", 0),
  };

  let productId = id;
  if (id) {
    await db.update(products).set(payload).where(eq(products.id, id));
  } else {
    const [row] = await db.insert(products).values(payload).returning();
    productId = row.id;
  }

  // extras: repeated fields extraName / extraPrice
  const names = formData.getAll("extraName").map((v) => String(v).trim());
  const prices = formData.getAll("extraPrice").map((v) => Number(v) || 0);
  await db.delete(productExtras).where(eq(productExtras.productId, productId));
  const extras = names
    .map((n, i) => ({ productId, name: n, price: toCents(prices[i] ?? 0), isActive: true }))
    .filter((e) => e.name.length > 0);
  if (extras.length) await db.insert(productExtras).values(extras);

  revalidatePath("/admin/products");
  revalidatePath("/vendor/products");
  return { ok: true, data: { id: productId } };
}

export async function deleteProductAction(id: number): Promise<Result> {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return { ok: false, error: "المنتج غير موجود" };
  await assertStoreAccess(product.storeId);
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/vendor/products");
  return { ok: true };
}

export async function duplicateProductAction(id: number): Promise<Result> {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return { ok: false, error: "المنتج غير موجود" };
  await assertStoreAccess(product.storeId);
  const { id: _omit, createdAt: _omit2, ...rest } = product;
  const [copy] = await db.insert(products).values({ ...rest, name: `${product.name} (نسخة)` }).returning();
  const extras = await db.select().from(productExtras).where(eq(productExtras.productId, id));
  if (extras.length)
    await db.insert(productExtras).values(extras.map((e) => ({ productId: copy.id, name: e.name, price: e.price, isActive: e.isActive })));
  revalidatePath("/admin/products");
  revalidatePath("/vendor/products");
  return { ok: true };
}

export async function toggleProductAvailabilityAction(id: number, isAvailable: boolean): Promise<Result> {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return { ok: false, error: "المنتج غير موجود" };
  await assertStoreAccess(product.storeId);
  await db.update(products).set({ isAvailable }).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/vendor/products");
  return { ok: true };
}

/* ----------------------------- CATEGORIES -------------------------------- */

export async function saveCategoryAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!name) return { ok: false, error: "اسم التصنيف مطلوب" };
  const payload = {
    name,
    nameFr: str(formData, "nameFr"),
    icon: str(formData, "icon", "UtensilsCrossed"),
    imageUrl: str(formData, "imageUrl") || null,
    kind: (str(formData, "kind", "restaurant") === "store" ? "store" : "restaurant") as "store" | "restaurant",
    sortOrder: num(formData, "sortOrder", 0),
    isActive: bool(formData, "isActive"),
  };
  if (id) await db.update(categories).set(payload).where(eq(categories.id, id));
  else
    await db
      .insert(categories)
      .values({ ...payload, slug: `${slugify(str(formData, "nameFr") || name) || "cat"}-${Math.floor(Math.random() * 900 + 100)}` });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategoryAction(id: number): Promise<Result> {
  await requireRole("admin");
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  return { ok: true };
}

/* ------------------------------- BANNERS --------------------------------- */

export async function saveBannerAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const id = num(formData, "id");
  const payload = {
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    imageUrl: str(formData, "imageUrl") || null,
    buttonLabel: str(formData, "buttonLabel", "اكتشف"),
    link: str(formData, "link", "/offers"),
    theme: str(formData, "theme", "orange"),
    sortOrder: num(formData, "sortOrder", 0),
    isActive: bool(formData, "isActive"),
    endsAt: formData.get("endsAt") ? new Date(String(formData.get("endsAt"))) : null,
  };
  if (!payload.title) return { ok: false, error: "العنوان مطلوب" };
  if (id) await db.update(banners).set(payload).where(eq(banners.id, id));
  else await db.insert(banners).values(payload);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBannerAction(id: number): Promise<Result> {
  await requireRole("admin");
  await db.delete(banners).where(eq(banners.id, id));
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------- COUPONS --------------------------------- */

export async function saveCouponAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const id = num(formData, "id");
  const code = str(formData, "code").toUpperCase();
  if (code.length < 3) return { ok: false, error: "كود غير صالح" };
  const type = str(formData, "type", "percent") as "percent" | "fixed" | "free_delivery";
  const payload = {
    code,
    description: str(formData, "description"),
    type,
    value: type === "fixed" ? toCents(num(formData, "value", 0)) : num(formData, "value", 0),
    minOrder: toCents(num(formData, "minOrder", 0)),
    maxDiscount: toCents(num(formData, "maxDiscount", 0)),
    usageLimit: num(formData, "usageLimit", 100),
    perUserLimit: num(formData, "perUserLimit", 1),
    storeId: num(formData, "storeId") || null,
    isActive: bool(formData, "isActive"),
    endsAt: formData.get("endsAt") ? new Date(String(formData.get("endsAt"))) : null,
  };
  if (id) await db.update(coupons).set(payload).where(eq(coupons.id, id));
  else await db.insert(coupons).values(payload);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCouponAction(id: number): Promise<Result> {
  await requireRole("admin");
  await db.delete(coupons).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { ok: true };
}

/* -------------------------------- OFFERS --------------------------------- */

export async function saveOfferAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const id = num(formData, "id");
  const storeId = num(formData, "storeId");
  if (!storeId) return { ok: false, error: "اختر المحل" };
  const payload = {
    storeId,
    productId: num(formData, "productId") || null,
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    imageUrl: str(formData, "imageUrl") || null,
    discountPercent: num(formData, "discountPercent", 20),
    oldPrice: toCents(num(formData, "oldPrice", 0)) || null,
    newPrice: toCents(num(formData, "newPrice", 0)) || null,
    isActive: bool(formData, "isActive"),
    endsAt: formData.get("endsAt") ? new Date(String(formData.get("endsAt"))) : null,
  };
  if (!payload.title) return { ok: false, error: "عنوان العرض مطلوب" };
  if (id) await db.update(offers).set(payload).where(eq(offers.id, id));
  else await db.insert(offers).values(payload);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  return { ok: true };
}

export async function deleteOfferAction(id: number): Promise<Result> {
  await requireRole("admin");
  await db.delete(offers).where(eq(offers.id, id));
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  return { ok: true };
}

/* ------------------------------- REVIEWS --------------------------------- */

export async function moderateReviewAction(id: number, status: "approved" | "rejected"): Promise<Result> {
  await requireRole("admin");
  await db.update(reviews).set({ status }).where(eq(reviews.id, id));
  revalidatePath("/admin/reviews");
  return { ok: true };
}

/* -------------------------------- USERS ---------------------------------- */

export async function setUserRoleAction(id: number, role: "customer" | "vendor" | "admin" | "driver"): Promise<Result> {
  await requireRole("admin");
  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function toggleUserActiveAction(id: number, isActive: boolean): Promise<Result> {
  await requireRole("admin");
  await db.update(users).set({ isActive }).where(eq(users.id, id));
  revalidatePath("/admin/customers");
  return { ok: true };
}

/* -------------------------------- DRIVERS -------------------------------- */

export async function saveDriverAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const id = num(formData, "id");
  const payload = {
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    vehicle: str(formData, "vehicle", "دراجة نارية"),
    status: str(formData, "status", "available") as "available" | "busy" | "offline",
  };
  if (!payload.name || !payload.phone) return { ok: false, error: "الاسم والهاتف مطلوبان" };
  if (id) await db.update(drivers).set(payload).where(eq(drivers.id, id));
  else await db.insert(drivers).values(payload);
  revalidatePath("/admin/drivers");
  return { ok: true };
}

export async function setDriverStatusAction(id: number, status: "available" | "busy" | "offline"): Promise<Result> {
  const user = await getCurrentUser();
  if (!user || !["admin", "driver"].includes(user.role)) return { ok: false, error: "غير مصرح" };
  await db.update(drivers).set({ status }).where(eq(drivers.id, id));
  revalidatePath("/admin/drivers");
  revalidatePath("/driver");
  return { ok: true };
}

/* ------------------------------- SETTINGS -------------------------------- */

export async function saveSettingsAction(_prev: Result | null, formData: FormData): Promise<Result> {
  await requireRole("admin");
  const value = {
    name: str(formData, "name", "سخرتي"),
    tagline: str(formData, "tagline"),
    serviceFee: toCents(num(formData, "serviceFee", 3)),
    defaultCommission: num(formData, "defaultCommission", 10),
    currency: "MAD",
    supportPhone: str(formData, "supportPhone"),
  };
  await db
    .insert(settings)
    .values({ key: "platform", value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function reseedDemoDataAction(): Promise<Result> {
  await requireRole("admin");
  const { runSeed } = await import("@/lib/seed");
  await db.execute(sql`delete from ${settings} where key = 'seed_version'`);
  await runSeed();
  revalidatePath("/", "layout");
  return { ok: true };
}
