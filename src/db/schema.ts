import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ----------------------------------------------------------------------------
 * SAKHRTI — Database schema
 * All monetary values are stored as INTEGER centimes (1 DH = 100).
 * -------------------------------------------------------------------------- */

export const userRole = pgEnum("user_role", ["customer", "vendor", "admin", "driver"]);
export const storeKind = pgEnum("store_kind", ["restaurant", "store"]);
export const storeStatus = pgEnum("store_status", ["pending", "approved", "suspended"]);
export const orderStatus = pgEnum("order_status", [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "on_the_way",
  "delivered",
  "cancelled",
]);
export const paymentMethod = pgEnum("payment_method", ["cash", "card", "online"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed", "free_delivery"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const driverStatus = pgEnum("driver_status", ["available", "busy", "offline"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("customer"),
    avatarUrl: text("avatar_url"),
    city: text("city"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

/** OTP / password reset codes — architecture ready for SMS providers. */
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(),
  code: text("code").notNull(),
  purpose: text("purpose").notNull().default("otp"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("home"),
  city: text("city").notNull(),
  street: text("street").notNull(),
  details: text("details"),
  notes: text("notes"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameFr: text("name_fr"),
    icon: text("icon").notNull().default("UtensilsCrossed"),
    imageUrl: text("image_url"),
    kind: storeKind("kind").notNull().default("restaurant"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const stores = pgTable(
  "stores",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    description: text("description"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    phone: text("phone"),
    address: text("address"),
    city: text("city").notNull().default("برشيد"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    kind: storeKind("kind").notNull().default("restaurant"),
    ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
    deliveryFee: integer("delivery_fee").notNull().default(1000),
    minOrder: integer("min_order").notNull().default(5000),
    deliveryRadiusKm: doublePrecision("delivery_radius_km").notNull().default(8),
    deliveryMinMinutes: integer("delivery_min_minutes").notNull().default(25),
    deliveryMaxMinutes: integer("delivery_max_minutes").notNull().default(40),
    distanceKm: doublePrecision("distance_km").notNull().default(2.4),
    rating: doublePrecision("rating").notNull().default(4.5),
    reviewCount: integer("review_count").notNull().default(0),
    orderCount: integer("order_count").notNull().default(0),
    commissionRate: doublePrecision("commission_rate").notNull().default(10),
    status: storeStatus("status").notNull().default("approved"),
    isOpen: boolean("is_open").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    freeDelivery: boolean("free_delivery").notNull().default(false),
    discountLabel: text("discount_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("stores_slug_uq").on(t.slug), index("stores_kind_idx").on(t.kind)],
);

export const storeHours = pgTable("store_hours", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("23:30"),
  isClosed: boolean("is_closed").notNull().default(false),
});

export const menuSections = pgTable("menu_sections", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    sectionId: integer("section_id").references(() => menuSections.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: integer("price").notNull(),
    oldPrice: integer("old_price"),
    discountPercent: integer("discount_percent").notNull().default(0),
    isPopular: boolean("is_popular").notNull().default(false),
    isAvailable: boolean("is_available").notNull().default(true),
    stock: integer("stock").notNull().default(100),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_store_idx").on(t.storeId)],
);

export const productExtras = pgTable("product_extras", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const productOptions = pgTable("product_options", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  values: jsonb("values").$type<{ label: string; priceDelta: number }[]>().notNull().default([]),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "restrict" }),
    driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    status: orderStatus("status").notNull().default("received"),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    serviceFee: integer("service_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    commission: integer("commission").notNull().default(0),
    vendorEarnings: integer("vendor_earnings").notNull().default(0),
    platformRevenue: integer("platform_revenue").notNull().default(0),
    paymentMethod: paymentMethod("payment_method").notNull().default("cash"),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    contactName: text("contact_name").notNull(),
    phone: text("phone").notNull(),
    addressLabel: text("address_label"),
    addressText: text("address_text").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    notes: text("notes"),
    couponCode: text("coupon_code"),
    etaMinutes: integer("eta_minutes").notNull().default(35),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("orders_code_uq").on(t.code), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  lineTotal: integer("line_total").notNull(),
});

export const orderItemExtras = pgTable("order_item_extras", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: integer("price").notNull().default(0),
});

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull().default("زبون سخرتي"),
  rating: integer("rating").notNull().default(5),
  deliveryRating: integer("delivery_rating").notNull().default(5),
  productRating: integer("product_rating").notNull().default(5),
  comment: text("comment"),
  status: reviewStatus("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    description: text("description"),
    type: couponType("type").notNull().default("percent"),
    value: integer("value").notNull().default(10),
    minOrder: integer("min_order").notNull().default(0),
    maxDiscount: integer("max_discount").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    usageLimit: integer("usage_limit").notNull().default(1000),
    perUserLimit: integer("per_user_limit").notNull().default(3),
    usedCount: integer("used_count").notNull().default(0),
    storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  discount: integer("discount").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  discountPercent: integer("discount_percent").notNull().default(20),
  oldPrice: integer("old_price"),
  newPrice: integer("new_price"),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  buttonLabel: text("button_label").default("اكتشف"),
  link: text("link").default("/offers"),
  theme: text("theme").notNull().default("orange"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  audience: text("audience").notNull().default("customer"),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").notNull().default("order"),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  vehicle: text("vehicle").notNull().default("دراجة نارية"),
  status: driverStatus("status").notNull().default("available"),
  lat: doublePrecision("lat").default(33.2667),
  lng: doublePrecision("lng").default(-7.5869),
  rating: doublePrecision("rating").notNull().default(4.8),
  deliveriesCount: integer("deliveries_count").notNull().default(0),
  earnings: integer("earnings").notNull().default(0),
  avatarUrl: text("avatar_url"),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  status: text("status").notNull().default("assigned"),
  fee: integer("fee").notNull().default(0),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
  pickedAt: timestamp("picked_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("cash_on_delivery"),
  method: paymentMethod("method").notNull().default("cash"),
  amount: integer("amount").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Storage: uploaded media kept in DB and streamed by /api/media/[id]. */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
