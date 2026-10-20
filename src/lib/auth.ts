import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const COOKIE = "skh_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    // Dev fallback derived from the local database URL — never a hardcoded credential.
    `sakhrti-dev::${process.env.DATABASE_URL ?? "local"}`;
  return new TextEncoder().encode(secret);
}

export type Role = "customer" | "vendor" | "admin" | "driver";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  city: string | null;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: number, role: Role) {
  const token = await new SignJWT({ uid: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    const uid = Number(payload.uid);
    if (!uid) return null;
    const rows = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const user = rows[0] as User | undefined;
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      avatarUrl: user.avatarUrl,
      city: user.city,
    };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

/** Role-based capability matrix used across admin / vendor / driver areas. */
export const PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "platform.settings",
    "stores.manage",
    "products.manage",
    "orders.manage",
    "users.manage",
    "coupons.manage",
    "banners.manage",
    "reviews.moderate",
    "analytics.view",
    "drivers.manage",
  ],
  vendor: ["store.own", "products.own", "orders.own", "reviews.own", "analytics.own"],
  driver: ["deliveries.own", "orders.assigned"],
  customer: ["orders.self", "profile.self", "reviews.self"],
};

export function can(role: Role, permission: string) {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
