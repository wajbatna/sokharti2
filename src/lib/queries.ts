import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  banners,
  categories,
  coupons,
  drivers,
  favorites,
  media,
  menuSections,
  notifications,
  offers,
  orderEvents,
  orderItemExtras,
  orderItems,
  orders,
  productExtras,
  products,
  reviews,
  settings,
  storeHours,
  stores,
  users,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export type StoreFilters = {
  kind?: "restaurant" | "store";
  category?: string;
  city?: string;
  q?: string;
  sort?: "recommended" | "rating" | "delivery_time" | "delivery_fee" | "distance";
  freeDelivery?: boolean;
  openNow?: boolean;
  minRating?: number;
  maxFee?: number;
  hasOffer?: boolean;
  limit?: number;
  offset?: number;
};

export type StoreCardData = Awaited<ReturnType<typeof listStores>>["items"][number];

export async function listStores(filters: StoreFilters = {}) {
  await ensureSeeded();
  const {
    kind,
    category,
    city,
    q,
    sort = "recommended",
    freeDelivery,
    openNow,
    minRating,
    maxFee,
    hasOffer,
    limit = 24,
    offset = 0,
  } = filters;

  const where = [eq(stores.status, "approved")];
  if (kind) where.push(eq(stores.kind, kind));
  if (city) where.push(eq(stores.city, city));
  if (freeDelivery) where.push(eq(stores.freeDelivery, true));
  if (openNow) where.push(eq(stores.isOpen, true));
  if (typeof minRating === "number") where.push(gte(stores.rating, minRating));
  if (typeof maxFee === "number") where.push(lte(stores.deliveryFee, maxFee));
  if (hasOffer) where.push(sql`${stores.discountLabel} is not null`);
  if (category) where.push(sql`${stores.categoryId} in (select id from ${categories} where slug = ${category})`);
  if (q) {
    const like = `%${q}%`;
    where.push(or(ilike(stores.name, like), ilike(stores.nameEn, like), ilike(stores.description, like))!);
  }

  const orderBy = {
    recommended: [desc(stores.isFeatured), desc(stores.rating)],
    rating: [desc(stores.rating)],
    delivery_time: [asc(stores.deliveryMaxMinutes)],
    delivery_fee: [asc(stores.deliveryFee)],
    distance: [asc(stores.distanceKm)],
  }[sort];

  const rows = await db
    .select({
      id: stores.id,
      slug: stores.slug,
      name: stores.name,
      nameEn: stores.nameEn,
      description: stores.description,
      logoUrl: stores.logoUrl,
      coverUrl: stores.coverUrl,
      city: stores.city,
      kind: stores.kind,
      deliveryFee: stores.deliveryFee,
      minOrder: stores.minOrder,
      deliveryMinMinutes: stores.deliveryMinMinutes,
      deliveryMaxMinutes: stores.deliveryMaxMinutes,
      distanceKm: stores.distanceKm,
      rating: stores.rating,
      reviewCount: stores.reviewCount,
      isOpen: stores.isOpen,
      isNew: stores.isNew,
      isFeatured: stores.isFeatured,
      freeDelivery: stores.freeDelivery,
      discountLabel: stores.discountLabel,
      orderCount: stores.orderCount,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(stores)
    .leftJoin(categories, eq(stores.categoryId, categories.id))
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stores)
    .where(and(...where));

  return { items: rows, total: count };
}

export async function getHomeData(city?: string) {
  await ensureSeeded();
  const base: StoreFilters = { city, limit: 10 };
  const [cats, bannerRows, popular, nearby, topRated, newest, free, deals, storeMarket] = await Promise.all([
    listCategories(),
    listBanners(),
    listStores({ ...base, kind: "restaurant", sort: "recommended" }),
    listStores({ ...base, kind: "restaurant", sort: "distance" }),
    listStores({ ...base, kind: "restaurant", sort: "rating" }),
    db
      .select()
      .from(stores)
      .where(and(eq(stores.isNew, true), eq(stores.status, "approved")))
      .limit(10),
    listStores({ ...base, freeDelivery: true }),
    listStores({ ...base, hasOffer: true }),
    listStores({ ...base, kind: "store", sort: "recommended" }),
  ]);
  return {
    categories: cats,
    banners: bannerRows,
    popular: popular.items,
    nearby: nearby.items,
    topRated: topRated.items,
    newest: newest.map((s) => ({ ...s, categoryName: null, categorySlug: null })),
    freeDelivery: free.items,
    deals: deals.items,
    shops: storeMarket.items,
  };
}

export async function listCategories(kind?: "restaurant" | "store") {
  await ensureSeeded();
  const where = kind ? and(eq(categories.isActive, true), eq(categories.kind, kind)) : eq(categories.isActive, true);
  return db.select().from(categories).where(where).orderBy(asc(categories.sortOrder));
}

export async function listAllCategories() {
  await ensureSeeded();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function listBanners(activeOnly = true) {
  await ensureSeeded();
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder));
  return activeOnly ? rows.filter((b) => b.isActive) : rows;
}

export async function getStoreBySlug(slug: string) {
  await ensureSeeded();
  const [store] = await db
    .select({ store: stores, category: categories })
    .from(stores)
    .leftJoin(categories, eq(stores.categoryId, categories.id))
    .where(eq(stores.slug, slug))
    .limit(1);
  if (!store) return null;

  const [sections, items, hours, storeReviews] = await Promise.all([
    db.select().from(menuSections).where(eq(menuSections.storeId, store.store.id)).orderBy(asc(menuSections.sortOrder)),
    db.select().from(products).where(eq(products.storeId, store.store.id)).orderBy(asc(products.sortOrder)),
    db.select().from(storeHours).where(eq(storeHours.storeId, store.store.id)).orderBy(asc(storeHours.dayOfWeek)),
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.storeId, store.store.id), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(8),
  ]);

  const extras = items.length
    ? await db
        .select()
        .from(productExtras)
        .where(
          and(
            inArray(
              productExtras.productId,
              items.map((p) => p.id),
            ),
            eq(productExtras.isActive, true),
          ),
        )
    : [];

  return {
    ...store.store,
    category: store.category,
    sections,
    products: items.map((p) => ({ ...p, extras: extras.filter((e) => e.productId === p.id) })),
    hours,
    reviews: storeReviews,
  };
}

export type StoreDetail = NonNullable<Awaited<ReturnType<typeof getStoreBySlug>>>;
export type ProductWithExtras = StoreDetail["products"][number];

export async function listOffers() {
  await ensureSeeded();
  return db
    .select({
      offer: offers,
      store: {
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
        deliveryFee: stores.deliveryFee,
        rating: stores.rating,
        deliveryMinMinutes: stores.deliveryMinMinutes,
        deliveryMaxMinutes: stores.deliveryMaxMinutes,
      },
    })
    .from(offers)
    .innerJoin(stores, eq(offers.storeId, stores.id))
    .where(eq(offers.isActive, true))
    .orderBy(desc(offers.discountPercent));
}

export async function searchEverything(q: string, limitEach = 8) {
  await ensureSeeded();
  if (!q.trim()) return { stores: [], products: [], categories: [] };
  const like = `%${q.trim()}%`;
  const [storeRows, productRows, catRows] = await Promise.all([
    db
      .select({
        id: stores.id,
        slug: stores.slug,
        name: stores.name,
        logoUrl: stores.logoUrl,
        coverUrl: stores.coverUrl,
        rating: stores.rating,
        kind: stores.kind,
        deliveryFee: stores.deliveryFee,
        deliveryMinMinutes: stores.deliveryMinMinutes,
        deliveryMaxMinutes: stores.deliveryMaxMinutes,
        isOpen: stores.isOpen,
        discountLabel: stores.discountLabel,
        distanceKm: stores.distanceKm,
        reviewCount: stores.reviewCount,
        freeDelivery: stores.freeDelivery,
        isNew: stores.isNew,
        minOrder: stores.minOrder,
        city: stores.city,
        description: stores.description,
      })
      .from(stores)
      .where(and(eq(stores.status, "approved"), or(ilike(stores.name, like), ilike(stores.nameEn, like))))
      .limit(limitEach),
    db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        oldPrice: products.oldPrice,
        imageUrl: products.imageUrl,
        storeSlug: stores.slug,
        storeName: stores.name,
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(and(eq(products.isAvailable, true), ilike(products.name, like)))
      .limit(limitEach),
    db
      .select()
      .from(categories)
      .where(and(eq(categories.isActive, true), ilike(categories.name, like)))
      .limit(6),
  ]);
  return { stores: storeRows, products: productRows, categories: catRows };
}

export async function getPopularSearches() {
  return ["برغر", "بيتزا", "تاكوس", "سوشي", "قهوة", "حلويات", "بقالة", "صيدلية"];
}

export async function getOrderByCode(code: string) {
  await ensureSeeded();
  const [row] = await db
    .select({ order: orders, store: stores, driver: drivers })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .where(eq(orders.code, code))
    .limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.order.id));
  const extras = items.length
    ? await db
        .select()
        .from(orderItemExtras)
        .where(
          inArray(
            orderItemExtras.orderItemId,
            items.map((i) => i.id),
          ),
        )
    : [];
  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, row.order.id))
    .orderBy(asc(orderEvents.createdAt));
  return {
    ...row.order,
    store: row.store,
    driver: row.driver,
    items: items.map((i) => ({ ...i, extras: extras.filter((e) => e.orderItemId === i.id) })),
    events,
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderByCode>>>;

export async function listUserOrders(userId: number) {
  await ensureSeeded();
  const rows = await db
    .select({ order: orders, store: stores })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  const ids = rows.map((r) => r.order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return rows.map((r) => ({ ...r.order, store: r.store, items: items.filter((i) => i.orderId === r.order.id) }));
}

export async function listAllOrders(filters: { status?: string; storeId?: number; limit?: number } = {}) {
  await ensureSeeded();
  const where = [];
  if (filters.status && filters.status !== "all") where.push(eq(orders.status, filters.status as "received"));
  if (filters.storeId) where.push(eq(orders.storeId, filters.storeId));
  const rows = await db
    .select({ order: orders, store: stores, customer: users })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(filters.limit ?? 60);
  const ids = rows.map((r) => r.order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return rows.map((r) => ({
    ...r.order,
    store: r.store,
    customer: r.customer,
    items: items.filter((i) => i.orderId === r.order.id),
  }));
}

export async function listAddresses(userId: number) {
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
}

export async function listFavorites(userId: number) {
  await ensureSeeded();
  const favStores = await db
    .select({ fav: favorites, store: stores })
    .from(favorites)
    .innerJoin(stores, eq(favorites.storeId, stores.id))
    .where(and(eq(favorites.userId, userId), ne(favorites.storeId, 0)));
  const favProducts = await db
    .select({ fav: favorites, product: products, store: stores })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(favorites.userId, userId), isNull(favorites.storeId)));
  return { stores: favStores.map((f) => f.store), products: favProducts.map((f) => ({ ...f.product, store: f.store })) };
}

export async function getFavoriteStoreIds(userId?: number) {
  if (!userId) return [] as number[];
  const rows = await db
    .select({ storeId: favorites.storeId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), sql`${favorites.storeId} is not null`));
  return rows.map((r) => r.storeId!).filter(Boolean);
}

export async function listNotifications(userId: number) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function listCoupons(activeOnly = false) {
  await ensureSeeded();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.isActive), asc(coupons.code));
  return activeOnly ? rows.filter((c) => c.isActive) : rows;
}

export async function getAdminStats() {
  await ensureSeeded();
  const [revenue] = await db
    .select({
      gross: sql<number>`coalesce(sum(${orders.total}),0)::int`,
      platform: sql<number>`coalesce(sum(${orders.platformRevenue}),0)::int`,
      count: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(${orders.total}),0)::int`,
    })
    .from(orders)
    .where(ne(orders.status, "cancelled"));
  const [userCount] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const [storeCount] = await db.select({ c: sql<number>`count(*)::int` }).from(stores);
  const [productCount] = await db.select({ c: sql<number>`count(*)::int` }).from(products);
  const [driverCount] = await db.select({ c: sql<number>`count(*)::int` }).from(drivers);
  const [pendingReviews] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.status, "pending"));
  const statusBreakdown = await db
    .select({ status: orders.status, c: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${orders.total}),0)::int` })
    .from(orders)
    .groupBy(orders.status);
  const topStores = await db
    .select({ name: stores.name, slug: stores.slug, revenue: sql<number>`coalesce(sum(${orders.total}),0)::int`, count: sql<number>`count(*)::int` })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .groupBy(stores.name, stores.slug)
    .orderBy(desc(sql`sum(${orders.total})`))
    .limit(6);
  const daily = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${orders.total}),0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .limit(14);
  return {
    revenue: revenue.gross,
    platformRevenue: revenue.platform,
    orderCount: revenue.count,
    avgOrder: revenue.avg,
    users: userCount.c,
    stores: storeCount.c,
    products: productCount.c,
    drivers: driverCount.c,
    pendingReviews: pendingReviews.c,
    statusBreakdown,
    topStores,
    daily,
  };
}

export async function getVendorStore(userId: number) {
  await ensureSeeded();
  const [store] = await db.select().from(stores).where(eq(stores.ownerId, userId)).limit(1);
  return store ?? null;
}

export async function getVendorStats(storeId: number) {
  const [agg] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.vendorEarnings}),0)::int`,
      count: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(${orders.total}),0)::int`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), ne(orders.status, "cancelled")));
  const [productCount] = await db.select({ c: sql<number>`count(*)::int` }).from(products).where(eq(products.storeId, storeId));
  const [reviewAgg] = await db
    .select({ c: sql<number>`count(*)::int`, avg: sql<number>`coalesce(avg(${reviews.rating}),0)` })
    .from(reviews)
    .where(eq(reviews.storeId, storeId));
  return { revenue: agg.revenue, orders: agg.count, avgOrder: agg.avg, products: productCount.c, reviews: reviewAgg.c, rating: Number(reviewAgg.avg) };
}

export async function listStoreProducts(storeId: number) {
  return db.select().from(products).where(eq(products.storeId, storeId)).orderBy(asc(products.sortOrder));
}

export async function listAdminProducts(storeId?: number) {
  await ensureSeeded();
  const where = storeId ? eq(products.storeId, storeId) : undefined;
  return db
    .select({ product: products, storeName: stores.name, storeSlug: stores.slug })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(where)
    .orderBy(desc(products.id))
    .limit(200);
}

export async function getProductById(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return null;
  const extras = await db.select().from(productExtras).where(eq(productExtras.productId, id));
  return { ...row, extras };
}

export async function getStoreById(id: number) {
  const [row] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!row) return null;
  const hours = await db.select().from(storeHours).where(eq(storeHours.storeId, id)).orderBy(asc(storeHours.dayOfWeek));
  return { ...row, hours };
}

export async function listUsers(role?: string) {
  await ensureSeeded();
  const where = role ? eq(users.role, role as "customer") : undefined;
  return db.select().from(users).where(where).orderBy(desc(users.createdAt));
}

export async function listDrivers() {
  await ensureSeeded();
  return db.select().from(drivers).orderBy(desc(drivers.deliveriesCount));
}

export async function listReviews(status?: string) {
  await ensureSeeded();
  const where = status && status !== "all" ? eq(reviews.status, status as "approved") : undefined;
  return db
    .select({ review: reviews, storeName: stores.name })
    .from(reviews)
    .innerJoin(stores, eq(reviews.storeId, stores.id))
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .limit(80);
}

export async function listPayments() {
  await ensureSeeded();
  const { payments } = await import("@/db/schema");
  return db
    .select({ payment: payments, code: orders.code, customer: orders.contactName })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .orderBy(desc(payments.createdAt))
    .limit(60);
}

export async function getSetting<T = Record<string, unknown>>(key: string): Promise<T | null> {
  await ensureSeeded();
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return (row?.value as T) ?? null;
}

export async function getMedia(id: number) {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

export async function listAllStoresForSelect() {
  await ensureSeeded();
  return db.select({ id: stores.id, name: stores.name, kind: stores.kind }).from(stores).orderBy(asc(stores.name));
}
